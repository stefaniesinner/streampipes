package org.apache.streampipes.extensions.connectors.kafka.migration;

import org.apache.streampipes.extensions.api.extractor.IDataSinkParameterExtractor;
import org.apache.streampipes.extensions.api.migration.IDataSinkMigrator;
import org.apache.streampipes.extensions.connectors.kafka.shared.kafka.KafkaConfigProvider;
import org.apache.streampipes.extensions.connectors.kafka.sink.KafkaPublishSink;
import org.apache.streampipes.model.extensions.svcdiscovery.SpServiceTagPrefix;
import org.apache.streampipes.model.graph.DataSinkInvocation;
import org.apache.streampipes.model.migration.MigrationResult;
import org.apache.streampipes.model.migration.ModelMigratorConfig;
import org.apache.streampipes.model.staticproperty.FreeTextStaticProperty;
import org.apache.streampipes.model.staticproperty.StaticProperty;
import org.apache.streampipes.sdk.StaticProperties;
import org.apache.streampipes.sdk.helpers.Labels;

import java.util.List;

/**
 * Replaces the single-broker configuration (host and port) of the Kafka sink with a single
 * {@code bootstrap-servers} configuration that accepts a comma-separated list of brokers.
 */
public class KafkaSinkMigrationV3 implements IDataSinkMigrator {

  private static final String DEFAULT_PORT = "9092";

  @Override
  public ModelMigratorConfig config() {
    return new ModelMigratorConfig(
        KafkaPublishSink.ID,
        SpServiceTagPrefix.DATA_SINK,
        2,
        3
    );
  }

  @Override
  public MigrationResult<DataSinkInvocation> migrate(DataSinkInvocation element,
                                                     IDataSinkParameterExtractor extractor) throws RuntimeException {
    var staticProperties = element.getStaticProperties();
    var hostIndex = indexOf(staticProperties, KafkaConfigProvider.HOST_KEY);

    if (hostIndex < 0) {
      return MigrationResult.failure(
          element,
          "Could not migrate the Kafka sink, the configuration '%s' does not exist."
              .formatted(KafkaConfigProvider.HOST_KEY));
    }

    var host = valueOf(staticProperties, KafkaConfigProvider.HOST_KEY, "");
    var port = valueOf(staticProperties, KafkaConfigProvider.PORT_KEY, DEFAULT_PORT);

    staticProperties.removeIf(sp -> KafkaConfigProvider.HOST_KEY.equals(sp.getInternalName())
        || KafkaConfigProvider.PORT_KEY.equals(sp.getInternalName()));

    staticProperties.add(hostIndex, StaticProperties.stringFreeTextProperty(
        Labels.withId(KafkaConfigProvider.BOOTSTRAP_SERVERS_KEY),
        "%s:%s".formatted(host, port))
    );

    return MigrationResult.success(element);
  }

  private int indexOf(List<StaticProperty> staticProperties,
                      String internalName) {
    for (var i = 0; i < staticProperties.size(); i++) {
      if (internalName.equals(staticProperties.get(i).getInternalName())) {
        return i;
      }
    }
    return -1;
  }

  private String valueOf(List<StaticProperty> staticProperties,
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