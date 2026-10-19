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

import { FilterBtns } from './FilterBtns';

export class FilterUtils {
    public static clearFilter() {
        this.openFilterMenu();
        FilterBtns.resetFiltersBtn().click();
    }

    public static filterAssets(assetNames: string[]) {
        this.openFilterMenu();
        assetNames.forEach(assetName => {
            this.searchFor(assetName);
            FilterBtns.assetItem(assetName).click();
        });
        this.closeFilterMenu();
    }

    public static filterSites(siteNames: string[]) {
        this.filterBySearchResults(siteNames);
    }

    public static filterLabels(labelNames: string[]) {
        this.filterBySearchResults(labelNames);
    }

    public static filterTypes(typeLabels: string[]) {
        this.filterBySearchResults(typeLabels);
    }

    public static openAssetPreview(assetName: string) {
        this.openFilterMenu();
        this.searchFor(assetName);
        FilterBtns.assetPreviewBtn(assetName).click();
    }

    public static createAssetInNewTab() {
        this.openFilterMenu();
        FilterBtns.createAssetBtn().click();
        this.closeFilterMenu();
    }

    public static checkFilterMenuClosed() {
        FilterBtns.searchInput().should('not.exist');
    }

    private static openFilterMenu() {
        FilterBtns.filterBtn().should('be.enabled').click();
        FilterBtns.searchInput().should('be.visible');
    }

    private static closeFilterMenu() {
        FilterBtns.searchInput().type('{esc}');
    }

    private static searchFor(searchTerm: string) {
        FilterBtns.searchInput().clear().type(searchTerm);
    }

    private static filterBySearchResults(searchTerms: string[]) {
        this.openFilterMenu();
        searchTerms.forEach(searchTerm => {
            this.searchFor(searchTerm);
            FilterBtns.addAllResultsBtn().click();
        });
        this.closeFilterMenu();
    }
}
