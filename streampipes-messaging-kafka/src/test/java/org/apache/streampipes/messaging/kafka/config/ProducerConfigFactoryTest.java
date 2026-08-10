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

package org.apache.streampipes.messaging.kafka.config;

import org.apache.streampipes.model.grounding.KafkaTransportProtocol;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.testng.annotations.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProducerConfigFactoryTest {

  private static final String BOOTSTRAP_SERVERS = "broker1:9092,broker2:9092";

  /**
   * Step three of the regression test from the issue: the full list has to reach the Kafka
   * client, not just the first entry.
   */
  @Test
  void bootstrapServerListIsPassedToProducer() {
    var protocol = new KafkaTransportProtocol();
    protocol.setBootstrapServers(BOOTSTRAP_SERVERS);

    var props = new ProducerConfigFactory(protocol).buildProperties(List.of());

    assertEquals(BOOTSTRAP_SERVERS, props.get(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG));
  }

  @Test
  void bootstrapServerListIsPassedToConsumer() {
    var protocol = new KafkaTransportProtocol();
    protocol.setBootstrapServers(BOOTSTRAP_SERVERS);
    protocol.setGroupId("test-group");

    var props = new ConsumerConfigFactory(protocol).buildProperties(List.of());

    assertEquals(BOOTSTRAP_SERVERS, props.get(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG));
  }

  /**
   * Protocols created by the internal grounding do not define a bootstrap server list.
   * They have to keep working via the legacy host and port fields.
   */
  @Test
  void fallbackToLegacyHostAndPort() {
    var protocol = new KafkaTransportProtocol();
    protocol.setBrokerHostname("localhost");
    protocol.setKafkaPort(9092);

    var props = new ProducerConfigFactory(protocol).buildProperties(List.of());

    assertEquals("localhost:9092", props.get(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG));
  }

  @Test
  void bootstrapServersTakePrecedenceOverLegacyFields() {
    var protocol = new KafkaTransportProtocol();
    protocol.setBrokerHostname("legacy");
    protocol.setKafkaPort(1234);
    protocol.setBootstrapServers(BOOTSTRAP_SERVERS);

    var props = new ProducerConfigFactory(protocol).buildProperties(List.of());

    assertEquals(BOOTSTRAP_SERVERS, props.get(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG));
  }
}
