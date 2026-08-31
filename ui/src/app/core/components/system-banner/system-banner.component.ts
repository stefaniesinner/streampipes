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

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AlertType,
    BannerConfig,
    BannerService,
} from '@streampipes/platform-services';
import {
    CurrentUserService,
    SpAlertBannerComponent,
} from '@streampipes/shared-ui';
import { EMPTY, Subscription, timer } from 'rxjs';
import { catchError, exhaustMap, switchMap } from 'rxjs/operators';

const BANNER_POLL_INTERVAL_MS = 30000;

@Component({
    selector: 'sp-system-banner',
    templateUrl: './system-banner.component.html',
    styleUrls: ['./system-banner.component.scss'],
    imports: [SpAlertBannerComponent],
})
export class SpSystemBannerComponent implements OnInit {
    private bannerService = inject(BannerService);
    private currentUserService = inject(CurrentUserService);
    private destroyRef = inject(DestroyRef);

    banner: BannerConfig;
    private expiry$: Subscription;

    ngOnInit(): void {
        this.currentUserService.isLoggedIn$
            .pipe(
                switchMap(loggedIn =>
                    loggedIn ? this.pollActiveBanner() : this.clearBanner(),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(banner => this.applyBanner(banner));
    }

    get alertType(): AlertType {
        switch (this.banner?.severity) {
            case 'ERROR':
                return 'error';
            case 'WARNING':
                return 'warning';
            default:
                return 'info';
        }
    }

    private pollActiveBanner() {
        return timer(0, BANNER_POLL_INTERVAL_MS).pipe(
            exhaustMap(() =>
                this.bannerService
                    .getActiveBanner()
                    .pipe(catchError(() => EMPTY)),
            ),
        );
    }

    private clearBanner() {
        this.applyBanner(undefined);
        return EMPTY;
    }

    private applyBanner(banner: BannerConfig): void {
        this.banner = banner;
        this.expiry$?.unsubscribe();

        if (banner?.enabled && banner.expiresAt) {
            this.scheduleHideOnExpiry(banner.expiresAt);
        }
    }

    private scheduleHideOnExpiry(expiresAt: number): void {
        const delay = expiresAt - Date.now();
        if (delay <= 0) {
            this.banner = undefined;
            return;
        }

        this.expiry$ = timer(delay)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => (this.banner = undefined));
    }
}
