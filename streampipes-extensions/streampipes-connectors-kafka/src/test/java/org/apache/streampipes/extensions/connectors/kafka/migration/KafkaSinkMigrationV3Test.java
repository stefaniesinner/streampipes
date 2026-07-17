package org.apache.streampipes.extensions.connectors.kafka.migration;

import org.apache.streampipes.extensions.connectors.kafka.shared.kafka.KafkaConfigProvider;
import org.apache.streampipes.model.graph.DataSinkInvocation;
import org.apache.streampipes.model.staticproperty.FreeTextStaticProperty;
import org.apache.streampipes.model.staticproperty.StaticProperty;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KafkaSinkMigrationV3Test {

  @Test
  void hostAndPortAreMergedIntoBootstrapServers() {
    var element = makeSink("broker1", "9094");

    var result = new KafkaSinkMigrationV3().migrate(element, null);

    assertTrue(result.success());
    assertEquals("broker1:9094", bootstrapServersOf(result.element()));
  }

  @Test
  void defaultPortIsUsedWhenPortIsEmpty() {
    var element = makeSink("broker1", "");

    var result = new KafkaSinkMigrationV3().migrate(element, null);

    assertEquals("broker1:9092", bootstrapServersOf(result.element()));
  }

  @Test
  void oldConfigurationsAreRemovedAndOrderIsPreserved() {
    var element = makeSink("broker1", "9092");

    var result = new KafkaSinkMigrationV3().migrate(element, null);

    var internalNames = result.element()
        .getStaticProperties()
        .stream()
        .map(StaticProperty::getInternalName)
        .toList();

    assertEquals(
        List.of(
            KafkaConfigProvider.TOPIC_KEY,
            KafkaConfigProvider.BOOTSTRAP_SERVERS_KEY,
            KafkaConfigProvider.ACCESS_MODE,
            KafkaConfigProvider.ADDITIONAL_PROPERTIES),
        internalNames);
  }

  @Test
  void migrationFailsWhenHostConfigurationIsMissing() {
    var element = new DataSinkInvocation();
    element.setStaticProperties(new ArrayList<>(List.of(freeText(KafkaConfigProvider.TOPIC_KEY, "test"))));

    var result = new KafkaSinkMigrationV3().migrate(element, null);

    assertFalse(result.success());
  }

  private DataSinkInvocation makeSink(String host,
                                      String port) {
    var element = new DataSinkInvocation();
    element.setStaticProperties(new ArrayList<>(List.of(
        freeText(KafkaConfigProvider.TOPIC_KEY, "test-topic"),
        freeText(KafkaConfigProvider.HOST_KEY, host),
        freeText(KafkaConfigProvider.PORT_KEY, port),
        freeText(KafkaConfigProvider.ACCESS_MODE, ""),
        freeText(KafkaConfigProvider.ADDITIONAL_PROPERTIES, "")
    )));

    return element;
  }

  private FreeTextStaticProperty freeText(String internalName,
                                          String value) {
    var property = new FreeTextStaticProperty(internalName, internalName, "");
    property.setValue(value);
    return property;
  }

  private String bootstrapServersOf(DataSinkInvocation element) {
    return element.getStaticProperties()
        .stream()
        .filter(sp -> KafkaConfigProvider.BOOTSTRAP_SERVERS_KEY.equals(sp.getInternalName()))
        .map(sp -> ((FreeTextStaticProperty) sp).getValue())
        .findFirst()
        .orElseThrow();
  }
}