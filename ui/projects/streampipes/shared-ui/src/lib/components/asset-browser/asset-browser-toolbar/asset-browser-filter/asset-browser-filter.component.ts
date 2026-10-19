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

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import {
    LayoutAlignDirective,
    LayoutDirective,
    LayoutGapDirective,
} from '@ngbracket/ngx-layout/flex';
import { Isa95TypeService, SpAsset } from '@streampipes/platform-services';
import { AssetBrowserData, AssetFilterItem } from '../../asset-browser.model';
import { SpAssetBrowserService } from '../../asset-browser.service';
import { SpSearchFieldComponent } from '../../../search-field/search-field.component';
import { AssetBrowserFilterItemComponent } from './asset-browser-filter-item/asset-browser-filter-item.component';

@Component({
    selector: 'sp-asset-browser-filter',
    templateUrl: 'asset-browser-filter.component.html',
    styleUrl: 'asset-browser-filter.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        LayoutDirective,
        LayoutGapDirective,
        LayoutAlignDirective,
        MatButton,
        MatIconButton,
        MatIcon,
        MatTooltip,
        TranslatePipe,
        SpSearchFieldComponent,
        AssetBrowserFilterItemComponent,
    ],
})
export class AssetBrowserFilterComponent
    implements OnInit, OnChanges, OnDestroy
{
    private assetBrowserService = inject(SpAssetBrowserService);
    private typeService = inject(Isa95TypeService);

    @Input()
    assetBrowserData: AssetBrowserData;

    @Input()
    canCreateAsset = false;

    @Output()
    closeMenu: EventEmitter<void> = new EventEmitter();

    @Output()
    createAsset: EventEmitter<void> = new EventEmitter();

    @ViewChild(SpSearchFieldComponent)
    searchField!: SpSearchFieldComponent;

    assetItems: AssetFilterItem[] = [];
    filteredAssetItems: AssetFilterItem[] = [];
    selectedAssetIds = new Set<string>();
    searchTerm = '';

    filter$: Subscription;

    /**
     * Follows the selection, which the service also changes on reload.
     */
    ngOnInit(): void {
        this.filter$ = this.assetBrowserService.filter$.subscribe(
            activeFilters => {
                this.selectedAssetIds = new Set(
                    activeFilters?.selectedAssetIds ?? [],
                );
            },
        );
    }

    /**
     * Rebuilds the searchable list whenever freshly loaded asset data arrives.
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['assetBrowserData']) {
            this.assetItems = this.toAssetFilterItems(
                this.assetBrowserData?.assets ?? [],
                [],
            );
            this.applySearch();
        }
    }

    /**
     * Narrows the list to the term, like the chart selection in dashboards.
     */
    setSearchTerm(value: string): void {
        this.searchTerm = value;
        this.applySearch();
    }

    /**
     * Shows all assets again from the empty-result hint.
     */
    clearSearch(): void {
        this.searchField.clearSearch();
    }

    /**
     * Tells the card whether it is part of the active filter.
     */
    isSelected(item: AssetFilterItem): boolean {
        return this.selectedAssetIds.has(item.asset.assetId);
    }

    /**
     * Offers "add all results" only while a search narrows the list.
     */
    hasActiveSearch(): boolean {
        return this.searchTerm.trim().length > 0;
    }

    /**
     * Disables "add all results" when there is nothing left to add.
     */
    hasUnselectedResults(): boolean {
        return this.filteredAssetItems.some(item => !this.isSelected(item));
    }

    /**
     * Adds or removes one asset; the filter applies right away.
     */
    toggleAsset(item: AssetFilterItem): void {
        const selectedAssetIds = new Set(this.selectedAssetIds);
        if (selectedAssetIds.has(item.asset.assetId)) {
            selectedAssetIds.delete(item.asset.assetId);
        } else {
            selectedAssetIds.add(item.asset.assetId);
        }
        this.assetBrowserService.selectAssets([...selectedAssetIds]);
    }

    /**
     * Adds all results at once, which replaces the old site, label and type dropdowns.
     */
    addAllResults(): void {
        const selectedAssetIds = new Set(this.selectedAssetIds);
        this.filteredAssetItems.forEach(item =>
            selectedAssetIds.add(item.asset.assetId),
        );
        this.assetBrowserService.selectAssets([...selectedAssetIds]);
    }

    /**
     * Removes every selection and closes the menu, like the old reset button.
     */
    resetFilters(): void {
        this.searchField.clearSearch();
        this.assetBrowserService.selectAssets([]);
        this.closeMenu.emit();
    }

    /**
     * Asks the app to open the asset editor in a new tab, like "new chart" in dashboards.
     */
    createNewAsset(): void {
        this.createAsset.emit();
    }

    /**
     * Reloads assets that were changed in another view or tab.
     */
    refreshAssets(): void {
        this.assetBrowserService.loadAssetData();
    }

    /**
     * Keeps keys inside the panel, since the menu treats Home, End and Tab as navigation.
     * Escape still bubbles up, so the menu closes as usual.
     */
    keepKeysInSearchField(event: KeyboardEvent): void {
        if (event.key !== 'Escape') {
            event.stopPropagation();
        }
    }

    /**
     * Unsubscribes so the component does not follow the filter after removal.
     */
    ngOnDestroy(): void {
        this.filter$?.unsubscribe();
    }

    /**
     * Lists assets and their sub assets as one searchable list.
     */
    private toAssetFilterItems(
        assets: SpAsset[],
        parentNames: string[],
    ): AssetFilterItem[] {
        return assets.flatMap(asset => [
            this.toAssetFilterItem(asset, parentNames),
            ...this.toAssetFilterItems(asset.assets ?? [], [
                ...parentNames,
                asset.assetName,
            ]),
        ]);
    }

    /**
     * Prepares display and search texts once, so typing only compares strings.
     */
    private toAssetFilterItem(
        asset: SpAsset,
        parentNames: string[],
    ): AssetFilterItem {
        const isa95Type = asset.assetType?.isa95AssetType;
        const typeLabel = isa95Type ? this.typeService.toLabel(isa95Type) : '';
        const siteLabel = this.findSiteLabel(asset);

        return {
            asset,
            assetPath: parentNames.join(' / '),
            details: [typeLabel, siteLabel]
                .filter((value): value is string => !!value)
                .join(' · '),
            dataCyId: `asset-filter-item-${asset.assetName.replace(/ /g, '')}`,
            searchText: [
                asset.assetName,
                typeLabel,
                siteLabel,
                ...this.findLabelNames(asset),
            ]
                .filter((value): value is string => !!value)
                .join(' ')
                .toLowerCase(),
        };
    }

    /**
     * Resolves the site name, because assets only store the site id.
     */
    private findSiteLabel(asset: SpAsset): string {
        const site = this.assetBrowserData.sites.find(
            candidate => candidate._id === asset.assetSite?.siteId,
        );
        return site?.label ?? '';
    }

    /**
     * Resolves label names, because assets only store label ids.
     */
    private findLabelNames(asset: SpAsset): string[] {
        const labelIds = asset.labelIds ?? [];
        return this.assetBrowserData.labels
            .filter(label => labelIds.some(labelId => labelId === label._id))
            .map(label => label.label);
    }

    /**
     * Matches the term against the prepared search text, same as the chart selection.
     */
    private applySearch(): void {
        const query = this.searchTerm.trim().toLowerCase();
        if (!query) {
            this.filteredAssetItems = this.assetItems;
            return;
        }

        this.filteredAssetItems = this.assetItems.filter(item =>
            item.searchText.includes(query),
        );
    }
}
