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

package org.apache.streampipes.model.configuration;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests for the implementation of the {@link BannerConfig} class.
 */
class BannerConfigTest {

  private static final Instant NOW = Instant.parse("2026-08-31T10:00:00Z");
  private static final String TEXT = "Maintenance from 22:00 to 23:00";

  @Test
  void shouldBeDisplayedAt_EnabledWithoutExpiry() {
    var config = new BannerConfig(true, TEXT, BannerSeverity.WARNING, null);
    assertTrue(config.shouldBeDisplayedAt(NOW));
  }

  @Test
  void shouldBeDisplayedAt_ExpiryInFuture() {
    var config = new BannerConfig(true, TEXT, BannerSeverity.WARNING,
        NOW.plusSeconds(60).toEpochMilli());
    assertTrue(config.shouldBeDisplayedAt(NOW));
  }

  @Test
  void shouldBeDisplayedAt_ExpiryInPast() {
    var config = new BannerConfig(true, TEXT, BannerSeverity.WARNING,
        NOW.minusSeconds(60).toEpochMilli());
    assertFalse(config.shouldBeDisplayedAt(NOW));
  }

  @Test
  void shouldBeDisplayedAt_Disabled() {
    var config = new BannerConfig(false, TEXT, BannerSeverity.INFO, null);
    assertFalse(config.shouldBeDisplayedAt(NOW));
  }

  @Test
  void shouldBeDisplayedAt_BlankText() {
    var config = new BannerConfig(true, "   ", BannerSeverity.INFO, null);
    assertFalse(config.shouldBeDisplayedAt(NOW));
  }
}
