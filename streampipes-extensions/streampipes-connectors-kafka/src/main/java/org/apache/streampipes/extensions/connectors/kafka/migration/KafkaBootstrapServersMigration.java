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

package org.apache.streampipes.extensions.connectors.kafka.migration;

import org.apache.streampipes.extensions.connectors.kafka.shared.kafka.KafkaConfigProvider;
import org.apache.streampipes.model.staticproperty.FreeTextStaticProperty;
import org.apache.streampipes.model.staticproperty.StaticProperty;
import org.apache.streampipes.sdk.StaticProperties;

import java.util.List;

/**
 * Shared migration logic for the Kafka adapter and the Kafka sink. Both used to declare a text
 * property for the host and an integer property for the port. Both are replaced by a single
 * property holding a comma-separated list of bootstrap servers.
 *
 * <p>The legacy values are read from the property list itself instead of the parameter extractor.
 * The extractor resolves against the current, already migrated description, so it cannot be relied
 * upon for properties that this migration is about to remove.
 */
public class KafkaBootstrapServersMigration {

  private static final String DEFAULT_PORT = "9092";

  private KafkaBootstrapServersMigration() {
  }

  /**
   * Merges the legacy host and port properties into a single bootstrap server property.
   * The new property is inserted at the position of the former host property so that the order
   * of the configuration form is preserved.
   *
   * @param staticProperties the mutable property list of the description
   * @return {@code true} if the legacy host property was present and the merge was applied
   */
  public static boolean merge(List<StaticProperty> staticProperties) {
    var hostIndex = indexOf(staticProperties, KafkaConfigProvider.HOST_KEY);
    if (hostIndex < 0) {
      return false;
    }

    var host = valueOf(staticProperties, KafkaConfigProvider.HOST_KEY, "");
    var port = valueOf(staticProperties, KafkaConfigProvider.PORT_KEY, DEFAULT_PORT);

    staticProperties.removeIf(sp -> KafkaConfigProvider.HOST_KEY.equals(sp.getInternalName())
        || KafkaConfigProvider.PORT_KEY.equals(sp.getInternalName()));

    staticProperties.add(hostIndex, StaticProperties.stringFreeTextProperty(
        KafkaConfigProvider.getBootstrapServersLabel(),
        "%s:%s".formatted(host, port)
    ));

    return true;
  }

  /**
   * Builds the failure message used when the legacy host property cannot be found.
   *
   * @param elementType the element being migrated, used in the message only
   * @return the message passed to the migration result
   */
  public static String missingHostMessage(String elementType) {
    return "Could not migrate the Kafka %s, the configuration '%s' does not exist."
        .formatted(elementType, KafkaConfigProvider.HOST_KEY);
  }

  private static int indexOf(List<StaticProperty> staticProperties,
                             String internalName) {
    for (var i = 0; i < staticProperties.size(); i++) {
      if (internalName.equals(staticProperties.get(i).getInternalName())) {
        return i;
      }
    }
    return -1;
  }

  private static String valueOf(List<StaticProperty> staticProperties,
                                String internalName,
                                String defaultValue) {
    return staticProperties
        .stream()
        .filter(sp -> internalName.equals(sp.getInternalName()))
        .filter(FreeTextStaticProperty.class::isInstance)
        .map(sp -> ((FreeTextStaticProperty) sp).getValue())
        .filter(value -> value != null && !value.isBlank())
        .map(String::trim)
        .findFirst()
        .orElse(defaultValue);
  }
}