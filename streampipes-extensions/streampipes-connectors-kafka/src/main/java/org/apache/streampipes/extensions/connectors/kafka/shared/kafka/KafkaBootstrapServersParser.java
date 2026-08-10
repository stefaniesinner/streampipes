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
 * given brokers. That keeps the check fast, deterministic and usable without network access.
 * Kafka clients use the bootstrap servers only to discover the actual cluster members and
 * tolerate unreachable entries as long as at least one broker responds.
 */
public class KafkaBootstrapServersParser {

  private static final String SEPARATOR = ",";

  private static final int MIN_PORT = 1;
  private static final int MAX_PORT = 65535;

  private static final String EMPTY_MESSAGE =
      "No Kafka bootstrap server was provided. Expected at least one entry in the format host:port, "
          + "e.g. broker1:9092,broker2:9092";

  /**
   * Either a bracketed IPv6 address such as {@code [::1]} or a plain hostname or IPv4 address,
   * followed by the port. The two alternatives keep unbalanced brackets and stray colons out.
   */
  private static final Pattern HOST_PORT_PATTERN =
      Pattern.compile("^(\\[[0-9a-zA-Z:._%\\-]+]|[0-9a-zA-Z._%\\-]+):([0-9]{1,5})$");

  private KafkaBootstrapServersParser() {
  }

  /**
   * Validates the given value and returns it in a normalized form, i.e. without surrounding
   * whitespace, empty entries and duplicates.
   *
   * @param rawValue a comma-separated list of {@code host:port} pairs
   * @return the normalized list, ready to be passed to a Kafka client
   * @throws SpRuntimeException if the value is empty or any entry is not a valid {@code host:port} pair
   */
  public static String parseAndValidate(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new SpRuntimeException(EMPTY_MESSAGE);
    }

    var bootstrapServers = new LinkedHashSet<String>();
    for (var entry : rawValue.split(SEPARATOR, -1)) {
      var bootstrapServer = entry.trim();
      if (!bootstrapServer.isEmpty()) {
        bootstrapServers.add(validate(bootstrapServer));
      }
    }

    if (bootstrapServers.isEmpty()) {
      throw new SpRuntimeException(EMPTY_MESSAGE);
    }

    return String.join(SEPARATOR, bootstrapServers);
  }

  private static String validate(String bootstrapServer) {
    var matcher = HOST_PORT_PATTERN.matcher(bootstrapServer);
    if (!matcher.matches()) {
      throw new SpRuntimeException(
          ("'%s' is not a valid Kafka bootstrap server. Expected host:port, with multiple servers "
              + "separated by a comma, e.g. broker1:9092,broker2:9092").formatted(bootstrapServer));
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