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
import { Router } from '@angular/router';
import { SpAssetModel } from '@streampipes/platform-services';
import { IdGeneratorService } from '../../core-services/id-generator/id-generator.service';

@Injectable({ providedIn: 'root' })
export class AssetCreationService {
    private router = inject(Router);
    private idGeneratorService = inject(IdGeneratorService);

    /**
     * Opens the editor for a new asset in the current tab.
     */
    navigateToNewAsset(): void {
        this.router.navigate(['assets', 'create']);
    }

    /**
     * Opens the editor for a new asset in a new tab, like "new chart" in dashboards.
     */
    openNewAssetInNewTab(): void {
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['assets', 'create']),
        );
        window.open('/#' + url, '_blank');
    }

    /**
     * Builds an unsaved asset with fresh ids, which the editor saves on first submit.
     */
    createDraft(): SpAssetModel {
        return {
            assetName: 'New Asset',
            assetDescription: '',
            assetLinks: [],
            assetId: this.idGeneratorService.generate(6),
            elementId: this.idGeneratorService.generate(24),
            appDocType: 'asset-management',
            removable: true,
            rev: undefined,
            assets: [],
            assetType: undefined,
            assetSite: undefined,
            additionalData: {},
            labelIds: [],
        };
    }
}
