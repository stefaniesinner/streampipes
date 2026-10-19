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
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { ChartService, ChartSummaryDto } from '@streampipes/platform-services';
import { AuthService } from '../../../../../services/auth.service';
import { UserPrivilege } from '../../../../../core/auth/user-privilege.enum';
import { ChartRegistry } from '../../../../../chart-shared/registry/chart-registry.service';
import { ChartRoutingService } from '../../../../../chart-shared/services/chart-routing.service';
import {
    FlexDirective,
    FlexFillDirective,
    LayoutAlignDirective,
    LayoutDirective,
    LayoutGapDirective,
} from '@ngbracket/ngx-layout/flex';
import { ChartPreviewComponent } from './chart-preview/chart-preview.component';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';
import {
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { finalize } from 'rxjs';
import { ChartSelectionItem } from './chart-selection.model';
import {
    SpSearchFieldComponent,
    SpSpinnerComponent,
} from '@streampipes/shared-ui';

@Component({
    selector: 'sp-chart-selection',
    templateUrl: './chart-selection.component.html',
    styleUrls: ['./chart-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FlexDirective,
        FlexFillDirective,
        LayoutGapDirective,
        LayoutDirective,
        ChartPreviewComponent,
        LayoutAlignDirective,
        MatButton,
        MatIconButton,
        MatIcon,
        SpSearchFieldComponent,
        SpSpinnerComponent,
        TranslatePipe,
        MatTooltip,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
    ],
})
export class ChartSelectionComponent implements OnInit {
    private dataViewService = inject(ChartService);
    private authService = inject(AuthService);
    private chartRegistryService = inject(ChartRegistry);
    private chartRoutingService = inject(ChartRoutingService);
    private cdr = inject(ChangeDetectorRef);

    @Output()
    addChartEmitter: EventEmitter<string> = new EventEmitter();

    @ViewChild(SpSearchFieldComponent)
    searchField!: SpSearchFieldComponent;

    charts: ChartSummaryDto[] = [];
    chartItems: ChartSelectionItem[] = [];
    filteredChartItems: ChartSelectionItem[] = [];
    searchTerm = '';
    isRefreshing = false;
    readonly chartItemSize = 132;

    hasChartWritePrivileges: boolean = false;

    ngOnInit(): void {
        this.hasChartWritePrivileges = this.authService.hasRole(
            UserPrivilege.PRIVILEGE_WRITE_DATA_EXPLORER_VIEW,
        );

        this.refreshCharts();
    }

    navigateToDataViewCreation(): void {
        this.chartRoutingService.navigateToCreateChart(true, undefined, true);
    }

    refreshCharts(): void {
        this.isRefreshing = true;
        this.cdr.markForCheck();
        this.dataViewService
            .getChartSummary()
            .pipe(
                finalize(() => {
                    this.isRefreshing = false;
                    this.cdr.markForCheck();
                }),
            )
            .subscribe({
                next: chartSummary => {
                    this.charts = [...chartSummary.resources].sort((a, b) =>
                        a.name.localeCompare(b.name),
                    );
                    this.chartItems = this.charts.map(chart =>
                        this.toChartSelectionItem(chart),
                    );
                    this.applySearch();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.charts = [];
                    this.chartItems = [];
                    this.filteredChartItems = [];
                },
            });
    }

    /**
     * Resets the search via the field, which reports the empty term back.
     */
    clearSearch(): void {
        this.searchField.clearSearch();
    }

    trackByChartId(index: number, item: ChartSelectionItem): string {
        return item.chart.elementId;
    }

    /**
     * Filters the chart list with the debounced term from the search field.
     */
    setSearchTerm(value: string): void {
        this.searchTerm = value;
        this.applySearch();
        this.cdr.markForCheck();
    }

    private toChartSelectionItem(chart: ChartSummaryDto): ChartSelectionItem {
        const template = this.chartRegistryService.getRegisteredChartSummary(
            chart.widgetType,
        );
        const widgetTypeLabel = template?.label ?? chart.widgetType;

        return {
            chart,
            widgetTypeLabel,
            widgetTypeIcon: template?.icon ?? 'insert_chart',
            dataCyId: `add-chart-btn-${chart.name.replaceAll(' ', '')}`,
            searchText: [
                chart.name,
                chart.datasetName,
                chart.widgetType,
                widgetTypeLabel,
            ]
                .filter((value): value is string => !!value)
                .join(' ')
                .toLowerCase(),
        };
    }

    private applySearch(): void {
        const query = this.searchTerm.trim().toLowerCase();
        if (!query) {
            this.filteredChartItems = this.chartItems;
            return;
        }

        this.filteredChartItems = this.chartItems.filter(item =>
            item.searchText.includes(query),
        );
    }
}
