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

import { TestBed } from '@angular/core/testing';
import {
    AssetLink,
    AssetManagementService,
    GenericStorageService,
    SpAsset,
    SpAssetModel,
} from '@streampipes/platform-services';
import { BehaviorSubject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CurrentUserService } from '../../services/current-user.service';
import { LocalStorageService } from '../../services/local-storage-settings.service';
import { SpAssetBrowserService } from './asset-browser.service';

describe('SpAssetBrowserService', () => {
    let service: SpAssetBrowserService;
    let loadedAssets: SpAssetModel[];

    const workCell = createAsset('work-cell', 'dashboard-work-cell', []);
    const line = createAsset('line', 'dashboard-line', [workCell]);
    const otherLine = createAsset('other-line', 'dashboard-other-line', []);

    beforeEach(() => {
        loadedAssets = [line, otherLine];
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AssetManagementService,
                    useValue: { getAllAssets: () => of(loadedAssets) },
                },
                {
                    provide: GenericStorageService,
                    useValue: { getAllDocuments: () => of([]) },
                },
                { provide: LocalStorageService, useValue: { set: () => {} } },
                {
                    provide: CurrentUserService,
                    useValue: { isLoggedIn$: new BehaviorSubject(true) },
                },
            ],
        });
        service = TestBed.inject(SpAssetBrowserService);
        service.applyAssetLinkType('dashboard');
    });

    it('selectAssets_emptySelection_disablesFilter', () => {
        service.selectAssets([]);

        const result = service.currentAssetFilter$.getValue();
        expect(result.filterActive).toBe(false);
        expect(result.selectedAssets?.length).toBe(2);
    });

    it('selectAssets_topLevelAssetSelected_includesLinksOfSubAssets', () => {
        service.selectAssets(['line']);

        const result = service.currentAssetFilter$.getValue();
        expect(result.filterActive).toBe(true);
        expect([...(result.activeElementIds ?? [])].sort()).toEqual([
            'dashboard-line',
            'dashboard-work-cell',
        ]);
    });

    it('selectAssets_subAssetSelected_includesOnlyLinksOfSubAsset', () => {
        service.selectAssets(['work-cell']);

        const result = service.currentAssetFilter$.getValue();
        expect([...(result.activeElementIds ?? [])]).toEqual([
            'dashboard-work-cell',
        ]);
        expect(result.selectedAssets?.map(asset => asset.assetId)).toEqual([
            'line',
        ]);
        expect((result.selectedAssets?.[0] as SpAssetModel).elementId).toBe(
            'line-element',
        );
    });

    it('selectAssets_subAssetSelected_countsAllAssetsOfHierarchy', () => {
        service.selectAssets(['work-cell']);

        const result = service.currentAssetFilter$.getValue();
        expect(result.selectedAssetCount).toBe(1);
        expect(result.allAssetCount).toBe(3);
    });

    it('loadAssetData_selectedAssetDeleted_dropsSelection', () => {
        service.selectAssets(['other-line']);
        loadedAssets = [line];

        service.loadAssetData();

        expect(service.filter$.getValue().selectedAssetIds).toEqual([]);
        expect(service.currentAssetFilter$.getValue().filterActive).toBe(false);
    });
});

/**
 * Builds a minimal asset with one dashboard link, enough for the filter logic.
 */
function createAsset(
    assetId: string,
    dashboardId: string,
    subAssets: SpAsset[],
): SpAssetModel {
    return {
        assetId,
        assetName: assetId,
        elementId: `${assetId}-element`,
        assetLinks: [
            { linkType: 'dashboard', resourceId: dashboardId } as AssetLink,
        ],
        assets: subAssets,
    } as SpAssetModel;
}
