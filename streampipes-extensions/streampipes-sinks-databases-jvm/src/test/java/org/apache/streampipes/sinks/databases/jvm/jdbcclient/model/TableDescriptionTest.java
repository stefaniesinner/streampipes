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

package org.apache.streampipes.sinks.databases.jvm.jdbcclient.model;

import org.apache.streampipes.commons.exceptions.SpRuntimeException;
import org.apache.streampipes.model.schema.EventProperty;
import org.apache.streampipes.model.schema.EventPropertyPrimitive;
import org.apache.streampipes.model.schema.EventSchema;
import org.apache.streampipes.vocabulary.XSD;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TableDescriptionTest {

    private TableDescription tableWith(HashMap<String, DbDataTypes> existingColumns) {
        List<EventProperty> props = new ArrayList<>();
        props.add(new EventPropertyPrimitive(XSD.LONG.toString(), "timestamp", "", null));
        props.add(new EventPropertyPrimitive(XSD.STRING.toString(), "sensorId", "", null));
        props.add(new EventPropertyPrimitive(XSD.FLOAT.toString(), "mass_flow", "", null));
        TableDescription td = new TableDescription("sensor_data", new EventSchema(props));
        td.setDataTypesHashMap(existingColumns);
        return td;
    }

    @Test
    void validatesMatchingTable() {
        HashMap<String, DbDataTypes> cols = new HashMap<>();
        cols.put("timestamp", DbDataTypes.BIGINT);
        cols.put("sensorId", DbDataTypes.VAR_CHAR);
        cols.put("mass_flow", DbDataTypes.REAL);
        assertDoesNotThrow(() -> tableWith(cols).validateTable());
    }

    @Test
    void failsOnMissingColumn() {
        HashMap<String, DbDataTypes> cols = new HashMap<>();
        cols.put("timestamp", DbDataTypes.BIGINT);
        cols.put("sensorId", DbDataTypes.VAR_CHAR);
        SpRuntimeException ex = assertThrows(SpRuntimeException.class, () -> tableWith(cols).validateTable());
        assertTrue(ex.getMessage().contains("mass_flow"));
    }

    @Test
    void failsOnTypeMismatch() {
        HashMap<String, DbDataTypes> cols = new HashMap<>();
        cols.put("timestamp", DbDataTypes.BIGINT);
        cols.put("sensorId", DbDataTypes.VAR_CHAR);
        cols.put("mass_flow", DbDataTypes.BIGINT);
        SpRuntimeException ex = assertThrows(SpRuntimeException.class, () -> tableWith(cols).validateTable());
        assertTrue(ex.getMessage().contains("mass_flow"));
    }
}
