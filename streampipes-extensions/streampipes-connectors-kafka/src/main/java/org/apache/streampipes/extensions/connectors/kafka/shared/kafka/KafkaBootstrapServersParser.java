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

package org.apache.streampipes.extensions.connectors.kafka.shared.kafka;

import org.apache.streampipes.commons.exceptions.SpRuntimeException;

import java.util.LinkedHashSet;
import java.util.regex.Pattern;

/**
 * Parses and validates a user-provided list of Kafka bootstrap servers in the standard Kafka
 * {@code bootstrap.servers} format, e.g. {@code broker1:9092,broker2:9092,broker3:9092}.
 *
 * <p>The validation is purely syntactical, no attempt is made to resolve or contact any of the
 * given brokers. Kafka clients only use the bootstrap servers to discover the actual cluster
 * members and tolerate unreachable entries as long as at least one broker responds.
 */
public class KafkaBootstrapServersParser {

  private static final String SEPARATOR = ",";

  private static final int MIN_PORT = 1;
  private static final int MAX_PORT = 65535;

  /**
   * Mirrors the host/port pattern used by the Kafka client itself, so bracketed and unbracketed
   * IPv6 addresses ({@code [::1]:9092}) are accepted as well.
   */
  private static final Pattern HOST_PORT_PATTERN = Pattern.compile("^\\[?([0-9a-zA-Z\\-%._:]*)]?:([0-9]{1,5})$");

  private KafkaBootstrapServersParser() {
  }

  /**
   * Validates the given value and returns it in a normalized form, i.e. without surrounding
   * whitespace, empty entries and duplicates.
   *
   * @param rawValue a comma-separated list of {@code host:port} pairs
   * @return the normalized list of bootstrap servers, ready to be passed to a Kafka client
   * @throws SpRuntimeException if the value is empty or if any entry is not a valid {@code host:port} pair
   */
  public static String parseAndValidate(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new SpRuntimeException(
          "No Kafka bootstrap server was provided. Expected at least one entry in the format host:port, "
              + "e.g. broker1:9092,broker2:9092");
    }

    var bootstrapServers = new LinkedHashSet<String>();
    for (var entry : rawValue.split(SEPARATOR, -1)) {
      var bootstrapServer = entry.trim();
      if (!bootstrapServer.isEmpty()) {
        bootstrapServers.add(validate(bootstrapServer));
      }
    }

    if (bootstrapServers.isEmpty()) {
      throw new SpRuntimeException(
          "No Kafka bootstrap server was provided. Expected at least one entry in the format host:port, "
              + "e.g. broker1:9092,broker2:9092");
    }

    return String.join(SEPARATOR, bootstrapServers);
  }

  private static String validate(String bootstrapServer) {
    var matcher = HOST_PORT_PATTERN.matcher(bootstrapServer);
    if (!matcher.matches() || matcher.group(1).isEmpty()) {
      throw new SpRuntimeException(
          "'%s' is not a valid Kafka bootstrap server, expected format is host:port".formatted(bootstrapServer));
    }

    var port = Integer.parseInt(matcher.group(2));
    if (port < MIN_PORT || port > MAX_PORT) {
      throw new SpRuntimeException(
          "'%s' contains the invalid port %s, expected a port between %s and %s"
              .formatted(bootstrapServer, port, MIN_PORT, MAX_PORT));
    }

    return bootstrapServer;
  }
}
