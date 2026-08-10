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

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class KafkaBootstrapServersParserTest {

  @Test
  void singleBootstrapServerIsAccepted() {
    assertEquals("broker1:9092", KafkaBootstrapServersParser.parseAndValidate("broker1:9092"));
  }

  @Test
  void multipleBootstrapServersAreAccepted() {
    assertEquals(
        "broker1:9092,broker2:9092,broker3:9092",
        KafkaBootstrapServersParser.parseAndValidate("broker1:9092,broker2:9092,broker3:9092"));
  }

  @Test
  void whitespaceAndEmptyEntriesAreRemoved() {
    assertEquals(
        "broker1:9092,broker2:9093",
        KafkaBootstrapServersParser.parseAndValidate(" broker1:9092 , , broker2:9093 ,"));
  }

  @Test
  void duplicatesAreRemovedAndOrderIsPreserved() {
    assertEquals(
        "broker2:9092,broker1:9092",
        KafkaBootstrapServersParser.parseAndValidate("broker2:9092,broker1:9092,broker2:9092"));
  }

  @Test
  void hostnamesAndIpAddressesAreAccepted() {
    assertEquals(
        "127.0.0.1:9092,[::1]:9093,BROKER-1.example.com:9094",
        KafkaBootstrapServersParser.parseAndValidate("127.0.0.1:9092,[::1]:9093,BROKER-1.example.com:9094"));
  }

  @Test
  void portBoundariesAreAccepted() {
    assertEquals("broker1:1,broker2:65535",
        KafkaBootstrapServersParser.parseAndValidate("broker1:1,broker2:65535"));
  }

  @ParameterizedTest
  @ValueSource(strings = {
      "broker1",
      "broker1:9092,broker2",
      ":9092",
      "broker1:0",
      "broker1:65536",
      "broker1:port",
      "kafka://broker1:9092",
      "[broker1:9092",
      "broker1]:9092",
      "broker:1:9092",
      "broker1: 9092",
      "broker1:9092:extra",
      ","
  })
  void invalidBootstrapServersAreRejected(String bootstrapServers) {
    assertThrows(SpRuntimeException.class, () -> KafkaBootstrapServersParser.parseAndValidate(bootstrapServers));
  }

  @Test
  void emptyValueIsRejected() {
    assertThrows(SpRuntimeException.class, () -> KafkaBootstrapServersParser.parseAndValidate("  "));
    assertThrows(SpRuntimeException.class, () -> KafkaBootstrapServersParser.parseAndValidate(null));
  }

  /**
   * Guards against the regression reported in the issue: the value used to be split on every
   * colon, which made the port parsing fail for a comma-separated list.
   */
  @Test
  void listIsNotSplitOnColon() {
    assertEquals("broker1:9092,broker2:9092",
        KafkaBootstrapServersParser.parseAndValidate("broker1:9092,broker2:9092"));
  }
}
