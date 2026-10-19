/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { inject, Injectable } from '@angular/core';
import {
    BehaviorSubject,
    distinctUntilChanged,
    map,
    Observable,
    skip,
    zip,
} from 'rxjs';
import {
    AssetConstants,
    AssetLinkType,
    AssetManagementService,
    GenericStorageService,
    SpAsset,
} from '@streampipes/platform-services';
import {
    AssetBrowserData,
    AssetFilter,
    FilterResult,
} from './asset-browser.model';
import { LocalStorageService } from '../../services/local-storage-settings.service';
import { CurrentUserService } from '../../services/current-user.service';

@Injectable({ providedIn: 'root' })
export class SpAssetBrowserService {
    private static readonly ASSET_DATA_REFRESH_KEY =
        'asset-browser-data-refresh';

    assetData$ = new BehaviorSubject<AssetBrowserData>(undefined);
    filter$ = new BehaviorSubject<AssetFilter>(undefined);
    currentAssetFilter$ = new BehaviorSubject<FilterResult>({
        filterActive: false,
        filterDisabled: true,
    });

    loadedAssetData: AssetBrowserData;
    activeAssetLink = undefined;

    private genericStorageService = inject(GenericStorageService);
    private assetService = inject(AssetManagementService);
    private localStorageService = inject(LocalStorageService);
    private currentUserService = inject(CurrentUserService);

    constructor() {
        this.listenForDataRefresh();
        this.currentUserService.isLoggedIn$
            .pipe(skip(1), distinctUntilChanged())
            .subscribe(isLoggedIn => {
                if (isLoggedIn) {
                    this.loadAssetData();
                } else {
                    this.resetState();
                }
            });
        this.loadAssetData();
    }

    applyAssetLinkType(assetLink: string) {
        this.activeAssetLink = assetLink;
        if (this.filter$.getValue() !== undefined) {
            this.applyFilters(this.filter$.getValue());
        }
    }

    getAssetLinkType$(linkType: string): Observable<AssetLinkType | undefined> {
        return this.assetData$.pipe(
            map(data =>
                data?.assetLinks.find(link => link.linkType === linkType),
            ),
            distinctUntilChanged(),
        );
    }

    loadAssetData(): void {
        const activeFilters = this.filter$.getValue();
        const assets$ = this.assetService.getAllAssets();
        const assetLinks$ = this.genericStorageService.getAllDocuments(
            AssetConstants.ASSET_LINK_TYPES_DOC_NAME,
        );
        const sites$ = this.genericStorageService.getAllDocuments(
            AssetConstants.ASSET_SITES_APP_DOC_NAME,
        );
        const labels$ = this.genericStorageService.getAllDocuments('sp-labels');

        zip([assets$, assetLinks$, sites$, labels$]).subscribe(res => {
            this.loadedAssetData = {
                assets: res[0].sort((a, b) =>
                    a.assetName.localeCompare(b.assetName),
                ),
                assetLinks: res[1],
                sites: res[2],
                labels: res[3].sort((a, b) => a.label.localeCompare(b.label)),
            };
            this.assetData$.next(this.loadedAssetData);
            if (activeFilters === undefined) {
                this.reloadFilters();
            } else {
                const refreshedFilters =
                    this.removeDeletedAssets(activeFilters);
                this.filter$.next(refreshedFilters);
                this.applyFilters(refreshedFilters);
            }
        });
    }

    refreshBrowserAssetData(): void {
        this.loadAssetData();
        this.localStorageService.set(
            SpAssetBrowserService.ASSET_DATA_REFRESH_KEY,
            {
                updatedAt: Date.now(),
            },
        );
    }

    private reloadFilters(): void {
        if (
            this.activeAssetLink !== undefined &&
            this.assetData$.getValue() !== undefined
        ) {
            this.selectAssets([]);
        }
    }

    resetFilters(): void {
        this.assetData$.next(this.loadedAssetData);
        this.reloadFilters();
    }

    private resetState(): void {
        this.loadedAssetData = undefined;
        this.assetData$.next(undefined);
        this.filter$.next(undefined);
        this.currentAssetFilter$.next({
            filterActive: false,
            filterDisabled: true,
        });
    }

    /**
     * Stores the selection and applies it at once, because the filter menu has no apply step.
     */
    selectAssets(selectedAssetIds: string[]): void {
        const filters: AssetFilter = { selectedAssetIds };
        this.filter$.next(filters);
        this.applyFilters(filters);
    }

    /**
     * Narrows all resources to the selected assets; an empty selection means no filter.
     */
    applyFilters(filter: AssetFilter) {
        const clonedLoadedAssetData = JSON.parse(
            JSON.stringify(this.loadedAssetData),
        ) as AssetBrowserData;

        if (filter.selectedAssetIds.length === 0) {
            this.currentAssetFilter$.next({
                filterActive: false,
                filterDisabled: false,
                activeElementIds: new Set<string>(),
                selectedAssets: clonedLoadedAssetData.assets,
                currentAssetLink: this.activeAssetLink,
            });
        } else {
            const selectedAssetIds = new Set(filter.selectedAssetIds);
            const filteredAssets = clonedLoadedAssetData.assets.flatMap(asset =>
                this.keepSelectedBranches(asset, selectedAssetIds),
            );
            this.applyAssetFilter(filteredAssets, selectedAssetIds.size);
        }
    }

    /**
     * Publishes the filtered assets and the resource ids linked to them.
     */
    applyAssetFilter(filteredAssets: SpAsset[], selectedAssetCount: number) {
        let elementIds: Set<string> | undefined = undefined;

        if (filteredAssets.length > 0) {
            const collectedElementIds = new Set<string>();
            filteredAssets.forEach(asset => {
                this.collectElementIds(
                    asset,
                    this.activeAssetLink,
                    collectedElementIds,
                );
            });
            elementIds =
                collectedElementIds.size > 0 ? collectedElementIds : undefined;
        }
        const currentFilter = {
            filterActive: true,
            activeElementIds: elementIds,
            selectedAssets: filteredAssets,
            currentAssetLink: this.activeAssetLink,
            allAssetCount: this.listAllAssets(this.loadedAssetData.assets)
                .length,
            selectedAssetCount,
            filterDisabled: false,
        };
        this.currentAssetFilter$.next(currentFilter);
    }

    /**
     * Keeps selected assets with everything below them, plus the parents leading there.
     * Parents lose their own links, so only resources of selected branches pass.
     * Returns an empty list instead of null when nothing in the branch is selected.
     */
    private keepSelectedBranches(
        asset: SpAsset,
        selectedAssetIds: Set<string>,
    ): SpAsset[] {
        if (selectedAssetIds.has(asset.assetId)) {
            return [asset];
        }
        const selectedSubAssets = (asset.assets ?? []).flatMap(subAsset =>
            this.keepSelectedBranches(subAsset, selectedAssetIds),
        );
        if (selectedSubAssets.length === 0) {
            return [];
        }
        return [{ ...asset, assetLinks: [], assets: selectedSubAssets }];
    }

    /**
     * Drops selections of assets deleted meanwhile, so the filter never points to missing assets.
     */
    private removeDeletedAssets(activeFilters: AssetFilter): AssetFilter {
        const existingAssetIds = new Set(
            this.listAllAssets(this.loadedAssetData.assets).map(
                asset => asset.assetId,
            ),
        );
        return {
            selectedAssetIds: activeFilters.selectedAssetIds.filter(assetId =>
                existingAssetIds.has(assetId),
            ),
        };
    }

    /**
     * Lists every asset of the hierarchy, because sub assets are selectable too.
     */
    private listAllAssets(assets: SpAsset[]): SpAsset[] {
        return assets.flatMap(asset => [
            asset,
            ...this.listAllAssets(asset.assets ?? []),
        ]);
    }

    collectElementIds(
        asset: SpAsset,
        filteredLinkType: string,
        elementIds: Set<string>,
    ): void {
        const assetLinkValues = this.findAssetLinkValues(
            asset,
            filteredLinkType,
        );
        assetLinkValues.forEach(v => elementIds.add(v));
        if (asset.assets !== undefined) {
            asset.assets.forEach((a: SpAsset) => {
                this.collectElementIds(a, filteredLinkType, elementIds);
            });
        } else {
            elementIds = new Set<string>();
        }
    }

    findAssetLinkValues(asset: SpAsset, filteredLinkType: string): string[] {
        return asset.assetLinks
            .filter(a => a.linkType === filteredLinkType)
            .map(a => a.resourceId);
    }

    private listenForDataRefresh(): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.addEventListener('storage', event => {
            if (
                event.key ===
                    `sp-${SpAssetBrowserService.ASSET_DATA_REFRESH_KEY}` &&
                event.newValue !== null
            ) {
                this.loadAssetData();
            }
        });
    }
}
