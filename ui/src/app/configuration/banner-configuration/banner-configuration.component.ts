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

import { Component, OnInit, inject } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
} from '@angular/forms';
import { BannerConfig, BannerService } from '@streampipes/platform-services';
import {
    DateInputComponent,
    FormFieldComponent,
    SpBasicNavTabsComponent,
    SpBreadcrumbService,
    SpNavigationItem,
    SplitSectionComponent,
} from '@streampipes/shared-ui';
import { SpConfigurationTabsService } from '../configuration-tabs.service';
import { SpConfigurationRoutes } from '../configuration.breadcrumb';
import { FlexDirective, LayoutDirective } from '@ngbracket/ngx-layout/flex';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'sp-banner-configuration',
    templateUrl: './banner-configuration.component.html',
    imports: [
        SpBasicNavTabsComponent,
        LayoutDirective,
        FlexDirective,
        FormsModule,
        ReactiveFormsModule,
        SplitSectionComponent,
        FormFieldComponent,
        DateInputComponent,
        MatFormField,
        MatInput,
        MatCheckbox,
        MatSelect,
        MatOption,
        MatButton,
        MatIcon,
        TranslatePipe,
    ],
})
export class SpBannerConfigurationComponent implements OnInit {
    private fb = inject(UntypedFormBuilder);
    private bannerService = inject(BannerService);
    private breadcrumbService = inject(SpBreadcrumbService);
    private tabService = inject(SpConfigurationTabsService);

    tabs: SpNavigationItem[] = [];
    parentForm: UntypedFormGroup;
    formReady = false;

    expiryDate: Date;

    ngOnInit(): void {
        this.tabs = this.tabService.getTabs();
        this.breadcrumbService.updateBreadcrumb([
            SpConfigurationRoutes.BASE,
            { label: this.tabService.getTabTitle('banner') },
        ]);

        this.bannerService.getBannerConfig().subscribe(config => {
            this.expiryDate = config.expiresAt
                ? new Date(config.expiresAt)
                : undefined;
            this.parentForm = this.fb.group({
                enabled: new UntypedFormControl(config.enabled),
                text: new UntypedFormControl(config.text),
                severity: new UntypedFormControl(config.severity ?? 'INFO'),
            });
            this.formReady = true;
        });
    }

    clearExpiry(): void {
        this.expiryDate = undefined;
    }

    updateConfig(): void {
        const formValue = this.parentForm.getRawValue();
        const config: BannerConfig = {
            ...formValue,
            expiresAt: this.expiryDate ? this.expiryDate.getTime() : undefined,
        };

        this.bannerService
            .updateBannerConfig(config)
            .subscribe(() => this.ngOnInit());
    }
}
