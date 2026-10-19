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
    input,
    output,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import {
    MatFormField,
    MatPrefix,
    MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { debounce, of, timer } from 'rxjs';

// Same delay the chart selection used before it moved to this component.
const SEARCH_DEBOUNCE_TIME_MS = 150;

@Component({
    selector: 'sp-search-field',
    templateUrl: './search-field.component.html',
    styleUrls: ['./search-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormField,
        MatPrefix,
        MatSuffix,
        MatInput,
        MatIcon,
        MatIconButton,
        ReactiveFormsModule,
        TranslatePipe,
    ],
})
export class SpSearchFieldComponent {
    readonly placeholder = input.required<string>();
    readonly dataCy = input<string | undefined>();

    readonly searchTermChange = output<string>();

    readonly searchControl = new FormControl('', { nonNullable: true });
    readonly hasActiveSearch = signal(false);

    /**
     * Debounces typing, so lists are not filtered again on every keystroke.
     * An empty term passes at once, so clearing the field feels instant.
     */
    constructor() {
        this.searchControl.valueChanges
            .pipe(
                debounce(value =>
                    value === '' ? of(value) : timer(SEARCH_DEBOUNCE_TIME_MS),
                ),
                takeUntilDestroyed(),
            )
            .subscribe(value => this.publishSearchTerm(value));
    }

    /**
     * Empties the field, so parents can reset the search without owning the input state.
     */
    clearSearch(): void {
        this.searchControl.setValue('');
    }

    /**
     * Reports the current term to the parent, which decides what to filter.
     */
    private publishSearchTerm(value: string): void {
        this.hasActiveSearch.set(value.trim().length > 0);
        this.searchTermChange.emit(value);
    }
}
