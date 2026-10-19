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
    Output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AssetFilterItem } from '../../../asset-browser.model';
import { FeatureCardService } from '../../../../feature-card-host/feature-card.service';

@Component({
    selector: 'sp-asset-browser-filter-item',
    templateUrl: './asset-browser-filter-item.component.html',
    styleUrls: ['./asset-browser-filter-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon, MatIconButton, TranslatePipe],
})
export class AssetBrowserFilterItemComponent {
    private featureCardService = inject(FeatureCardService);

    @Input()
    assetItem!: AssetFilterItem;

    @Input()
    selected = false;

    @Output()
    toggleAssetEmitter: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Toggles on click; preventDefault keeps Space from scrolling the list.
     */
    toggleAsset(event: Event): void {
        event.preventDefault();
        this.toggleAssetEmitter.emit();
    }

    /**
     * Toggles via keyboard only when the card itself has focus, so the preview button keeps its keys.
     */
    toggleAssetByKey(event: Event): void {
        if (event.target === event.currentTarget) {
            this.toggleAsset(event);
        }
    }

    /**
     * Shows the asset summary like the chart preview does, without changing the selection.
     */
    openPreview(event: MouseEvent): void {
        event.stopPropagation();
        this.featureCardService.openFeatureCard(
            'asset',
            this.assetItem.asset.assetId,
        );
    }
}
