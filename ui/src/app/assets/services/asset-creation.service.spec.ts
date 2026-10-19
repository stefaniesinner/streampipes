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
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetCreationService } from './asset-creation.service';

describe('AssetCreationService', () => {
    let service: AssetCreationService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        service = TestBed.inject(AssetCreationService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('createDraft_called_buildsUnsavedAssetWithIds', () => {
        const draft = service.createDraft();

        expect(draft.assetName).toBe('New Asset');
        expect(draft.assetId.length).toBeGreaterThan(0);
        expect(draft.elementId.length).toBeGreaterThan(0);
        expect(draft.assets).toEqual([]);
    });

    it('createDraft_calledTwice_usesDifferentIds', () => {
        const firstDraft = service.createDraft();
        const secondDraft = service.createDraft();

        expect(firstDraft.elementId).not.toBe(secondDraft.elementId);
    });

    it('navigateToNewAsset_called_opensCreateRoute', async () => {
        const router = TestBed.inject(Router);
        const navigateSpy = vi
            .spyOn(router, 'navigate')
            .mockResolvedValue(true);

        service.navigateToNewAsset();

        expect(navigateSpy).toHaveBeenCalledWith(['assets', 'create']);
    });

    it('openNewAssetInNewTab_called_opensCreateRouteInNewTab', () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(window);

        service.openNewAssetInNewTab();

        expect(openSpy).toHaveBeenCalledWith('/#/assets/create', '_blank');
    });
});
