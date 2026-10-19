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
    inject,
    Input,
    OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FlexFillDirective } from '@ngbracket/ngx-layout';
import {
    LayoutAlignDirective,
    LayoutDirective,
    LayoutGapDirective,
} from '@ngbracket/ngx-layout/flex';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import {
    AssetLink,
    AssetLinkType,
    Isa95TypeService,
    SpAsset,
    SpAssetModel,
    SpLabel,
} from '@streampipes/platform-services';
import {
    FeatureCardHeaderComponent,
    FeatureCardMetaSectionComponent,
    SpAssetBrowserService,
    SpLabelComponent,
} from '@streampipes/shared-ui';

@Component({
    selector: 'sp-asset-feature-card',
    templateUrl: './asset-feature-card.component.html',
    styleUrls: ['./asset-feature-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FlexFillDirective,
        LayoutDirective,
        LayoutAlignDirective,
        LayoutGapDirective,
        MatIcon,
        TranslatePipe,
        FeatureCardHeaderComponent,
        FeatureCardMetaSectionComponent,
        SpLabelComponent,
    ],
})
export class AssetFeatureCardComponent implements OnInit {
    @Input()
    resourceId: string;

    @Input()
    onClose?: () => void;

    asset: SpAsset;
    detailsLink: string[] = [];
    assetPath = '';
    typeLabel = '';
    locationLabel = '';
    areaLabel = '';
    assignedLabels: SpLabel[] = [];
    linkRows: AssetLinkRow[] = [];

    private assetBrowserService = inject(SpAssetBrowserService);
    private typeService = inject(Isa95TypeService);
    private router = inject(Router);

    /**
     * Reads the asset from the already loaded asset data, which also covers sub assets.
     */
    ngOnInit(): void {
        const assetData = this.assetBrowserService.assetData$.getValue();
        const assetWithParents = this.findAssetWithParents(
            assetData?.assets ?? [],
            [],
        );
        if (assetWithParents.length === 0) {
            return;
        }

        const topLevelAsset = assetWithParents[0] as SpAssetModel;
        this.asset = assetWithParents[assetWithParents.length - 1];
        this.detailsLink = [
            'assets',
            'details',
            topLevelAsset.elementId,
            'view',
        ];
        this.assetPath = assetWithParents
            .slice(0, -1)
            .map(parent => parent.assetName)
            .join(' / ');

        const isa95Type = this.asset.assetType?.isa95AssetType;
        this.typeLabel = isa95Type ? this.typeService.toLabel(isa95Type) : '';

        // Location and area are maintained on the top-level asset only.
        const assetSite = topLevelAsset.assetSite;
        this.locationLabel =
            assetData.sites.find(site => site._id === assetSite?.siteId)
                ?.label ?? '';
        this.areaLabel = assetSite?.area ?? '';

        const labelIds = this.asset.labelIds ?? [];
        this.assignedLabels = assetData.labels.filter(label =>
            labelIds.some(labelId => labelId === label._id),
        );
        this.linkRows = (this.asset.assetLinks ?? []).map(link =>
            this.toLinkRow(link, assetData.assetLinks),
        );
    }

    /**
     * Opens the asset details; sub assets open the page of their top-level asset.
     */
    navigateToAsset(): void {
        this.onClose?.();
        this.router.navigate(this.detailsLink);
    }

    /**
     * Finds the asset with its parents, because sub assets only exist inside a hierarchy.
     * Returns an empty list instead of null when the asset is unknown.
     */
    private findAssetWithParents(
        assets: SpAsset[],
        parents: SpAsset[],
    ): SpAsset[] {
        for (const asset of assets) {
            const path = [...parents, asset];
            if (asset.assetId === this.resourceId) {
                return path;
            }
            const found = this.findAssetWithParents(asset.assets ?? [], path);
            if (found.length > 0) {
                return found;
            }
        }
        return [];
    }

    /**
     * Shows a link with the icon and name of its resource type, like the asset details do.
     */
    private toLinkRow(
        link: AssetLink,
        linkTypes: AssetLinkType[],
    ): AssetLinkRow {
        const linkType = linkTypes.find(
            type => type.linkType === link.linkType,
        );
        return {
            resourceName: link.linkLabel,
            typeLabel: linkType?.linkLabel ?? link.linkType,
            icon: linkType?.linkIcon ?? 'link',
            color: linkType?.linkColor ?? 'var(--color-primary)',
        };
    }
}

interface AssetLinkRow {
    resourceName: string;
    typeLabel: string;
    icon: string;
    color: string;
}
