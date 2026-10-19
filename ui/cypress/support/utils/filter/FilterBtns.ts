/*
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

export class FilterBtns {
    public static filterBtn() {
        return cy.dataCy('filter-button', { timeout: 10000 });
    }

    public static resetFiltersBtn() {
        return cy.dataCy('reset-filters-btn', { timeout: 10000 });
    }

    public static searchInput() {
        return cy.dataCy('asset-filter-search', { timeout: 10000 });
    }

    public static addAllResultsBtn() {
        return cy.dataCy('add-all-results-btn', { timeout: 10000 });
    }

    public static assetItem(assetName: string) {
        return cy.dataCy(`asset-filter-item-${assetName}`, { timeout: 10000 });
    }

    public static assetPreviewBtn(assetName: string) {
        return cy.dataCy(`asset-filter-item-${assetName}-preview`, {
            timeout: 10000,
        });
    }

    public static createAssetBtn() {
        return cy.dataCy('create-asset-btn', { timeout: 10000 });
    }
}
