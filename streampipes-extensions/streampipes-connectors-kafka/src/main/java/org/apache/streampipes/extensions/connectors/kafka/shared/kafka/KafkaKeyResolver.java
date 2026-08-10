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
import org.apache.streampipes.model.runtime.Event;
import org.apache.streampipes.model.runtime.field.AbstractField;
import org.apache.streampipes.pe.shared.PlaceholderExtractor;

import java.io.Serializable;

/**
 * Resolves the key which is attached to a Kafka record for a given event.
 *
 * <p>Depending on the configured {@link KafkaMessageKeyMode}, the key is either omitted, a static
 * value, the value of a selected event field or an expression which may contain field placeholders
 * in the form {@code #fieldName#}.
 */
public class KafkaKeyResolver implements Serializable {

  private static final long serialVersionUID = 1L;

  private final KafkaMessageKeyMode mode;
  private final String keyDefinition;

  public KafkaKeyResolver(KafkaMessageKeyMode mode,
                          String keyDefinition) {
    this.mode = mode;
    this.keyDefinition = keyDefinition;
  }

  /**
   * Creates a resolver which publishes all records without a key.
   */
  public static KafkaKeyResolver noKey() {
    return new KafkaKeyResolver(KafkaMessageKeyMode.NONE, null);
  }

  /**
   * Resolves the key for the given event.
   *
   * @param event the event which is about to be published
   * @return the message key or {@code null} if the record should be published without a key
   * @throws SpRuntimeException if the configured key cannot be resolved for this event
   */
  public String resolveKey(Event event) {
    return switch (mode) {
      case NONE -> null;
      case STATIC -> emptyToNull(keyDefinition);
      case FIELD -> resolveFieldKey(event);
      case EXPRESSION -> resolveExpressionKey(event);
    };
  }

  public KafkaMessageKeyMode getMode() {
    return mode;
  }

  public String getKeyDefinition() {
    return keyDefinition;
  }

  private String resolveFieldKey(Event event) {
    if (isBlank(keyDefinition)) {
      throw new SpRuntimeException("No event field was selected as Kafka message key");
    }

    var field = getField(event);
    if (!field.isPrimitive()) {
      throw new SpRuntimeException(
          "Only primitive fields can be used as Kafka message key, but field %s is not primitive"
              .formatted(keyDefinition));
    }

    var rawValue = field.getAsPrimitive().getRawValue();
    return rawValue != null ? String.valueOf(rawValue) : null;
  }

  private AbstractField getField(Event event) {
    try {
      return event.getFieldBySelector(keyDefinition);
    } catch (IllegalArgumentException e) {
      throw new SpRuntimeException(
          "Field %s which was selected as Kafka message key is not part of the event"
              .formatted(keyDefinition), e);
    }
  }

  private String resolveExpressionKey(Event event) {
    if (isBlank(keyDefinition)) {
      throw new SpRuntimeException("No expression was provided for the Kafka message key");
    }

    try {
      return emptyToNull(PlaceholderExtractor.replacePlaceholders(event, keyDefinition));
    } catch (RuntimeException e) {
      throw new SpRuntimeException(
          "Could not resolve the Kafka message key expression %s".formatted(keyDefinition), e);
    }
  }

  private static String emptyToNull(String value) {
    return isBlank(value) ? null : value;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}