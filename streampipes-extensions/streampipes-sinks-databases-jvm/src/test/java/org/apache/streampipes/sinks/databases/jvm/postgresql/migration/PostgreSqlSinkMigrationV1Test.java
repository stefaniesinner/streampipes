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

package org.apache.streampipes.sinks.databases.jvm.postgresql.migration;

import org.apache.streampipes.model.extensions.svcdiscovery.SpServiceTagPrefix;
import org.apache.streampipes.model.graph.DataSinkInvocation;
import org.apache.streampipes.model.migration.MigrationResult;
import org.apache.streampipes.model.migration.ModelMigratorConfig;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PostgreSqlSinkMigrationV1Test {

    @Test
    void configTargetsVersionZeroToOne() {
        ModelMigratorConfig config = new PostgreSqlSinkMigrationV1().config();
        assertEquals("org.apache.streampipes.sinks.databases.jvm.postgresql", config.targetAppId());
        assertEquals(SpServiceTagPrefix.DATA_SINK, config.modelType());
        assertEquals(0, config.fromVersion());
        assertEquals(1, config.toVersion());
    }

    @Test
    void migrateAddsTwoStaticProperties() {
        DataSinkInvocation element = new DataSinkInvocation();
        element.setStaticProperties(new ArrayList<>());

        MigrationResult<DataSinkInvocation> result = new PostgreSqlSinkMigrationV1().migrate(element, null);

        assertTrue(result.success());
        assertEquals(2, element.getStaticProperties().size());
        assertTrue(element.getStaticProperties().stream()
                .anyMatch(sp -> PostgreSqlSinkMigrationV1.APPEND_TO_EXISTING_KEY.equals(sp.getInternalName())));
        assertTrue(element.getStaticProperties().stream()
                .anyMatch(sp -> PostgreSqlSinkMigrationV1.BATCH_SIZE_KEY.equals(sp.getInternalName())));
    }
}
