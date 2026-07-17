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
  void ipAddressesAreAccepted() {
    assertEquals(
        "127.0.0.1:9092,[::1]:9093,localhost:9094",
        KafkaBootstrapServersParser.parseAndValidate("127.0.0.1:9092,[::1]:9093,localhost:9094"));
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
}