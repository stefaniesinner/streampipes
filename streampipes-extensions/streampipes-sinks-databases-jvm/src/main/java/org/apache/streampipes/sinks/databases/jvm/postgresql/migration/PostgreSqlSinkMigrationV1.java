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

import org.apache.streampipes.extensions.api.extractor.IDataSinkParameterExtractor;
import org.apache.streampipes.extensions.api.migration.IDataSinkMigrator;
import org.apache.streampipes.model.extensions.svcdiscovery.SpServiceTagPrefix;
import org.apache.streampipes.model.graph.DataSinkInvocation;
import org.apache.streampipes.model.migration.MigrationResult;
import org.apache.streampipes.model.migration.ModelMigratorConfig;
import org.apache.streampipes.model.staticproperty.FreeTextStaticProperty;
import org.apache.streampipes.model.staticproperty.SlideToggleStaticProperty;
import org.apache.streampipes.sdk.helpers.Labels;
import org.apache.streampipes.vocabulary.XSD;

/**
 * Migrates the PostgreSQL sink from model version 0 to 1.
 * <p>
 * Version 1 adds two configuration fields: a toggle to write only to an existing table, and a
 * batch size for grouping events into a single insert. Existing pipelines get both fields with
 * safe defaults (toggle off, batch size 1).
 */
public class PostgreSqlSinkMigrationV1 implements IDataSinkMigrator {

    public static final String APPEND_TO_EXISTING_KEY = "append_to_existing";
    public static final String BATCH_SIZE_KEY = "batch_size";
    public static final String ID = "org.apache.streampipes.sinks.databases.jvm.postgresql";

    @Override
    public ModelMigratorConfig config() {
        return new ModelMigratorConfig(
                ID,
                SpServiceTagPrefix.DATA_SINK,
                0,
                1
        );
    }

    @Override
    public MigrationResult<DataSinkInvocation> migrate(DataSinkInvocation element,
                                                       IDataSinkParameterExtractor extractor) throws RuntimeException {

        var appendLabel = Labels.from(
                APPEND_TO_EXISTING_KEY,
                "Write to existing table only",
                "If enabled, the sink only writes to a table that already exists and never creates one.");
        var appendToggle = new SlideToggleStaticProperty(
                appendLabel.getInternalId(),
                appendLabel.getLabel(),
                appendLabel.getDescription(),
                false);
        appendToggle.setSelected(false);
        element.getStaticProperties().add(appendToggle);

        var batchLabel = Labels.from(
                BATCH_SIZE_KEY,
                "Batch Size",
                "Number of events buffered before a batch insert is sent. Set to 1 to write each event immediately.");
        var batchSize = new FreeTextStaticProperty(
                batchLabel.getInternalId(),
                batchLabel.getLabel(),
                batchLabel.getDescription());
        batchSize.setRequiredDatatype(XSD.INTEGER);
        batchSize.setValue("1");
        element.getStaticProperties().add(batchSize);

        return MigrationResult.success(element);
    }
}
