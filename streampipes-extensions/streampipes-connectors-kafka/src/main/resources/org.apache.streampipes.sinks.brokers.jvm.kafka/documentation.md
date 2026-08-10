<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one or more
  ~ contributor license agreements.  See the NOTICE file distributed with
  ~ this work for additional information regarding copyright ownership.
  ~ The ASF licenses this file to You under the Apache License, Version 2.0
  ~ (the "License"); you may not use this file except in compliance with
  ~ the License.  You may obtain a copy of the License at
  ~
  ~    http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing, software
  ~ distributed under the License is distributed on an "AS IS" BASIS,
  ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~ See the License for the specific language governing permissions and
  ~ limitations under the License.
  ~
  -->

## Kafka Publisher

<p align="center"> 
    <img src="icon.png" width="150px;" class="pe-image-documentation"/>
</p>

***

## Description
The Kafka Publisher sink enables StreamPipes to publish events to Apache Kafka topics. It provides:
* Real-time event publishing to Kafka topics
* Support for various security configurations
* Automatic topic creation if not exists
* Configurable message handling
* JSON message serialization

***

## Required Input
This sink accepts any incoming event type and serializes it to JSON format before publishing to Kafka.

***

## Configuration

### Broker Settings
* **Broker Hostname**: The hostname or IP address of the Kafka broker (e.g., test.server.com). Do not include the protocol.
* **Broker Port**: The port number of the Kafka broker (default: 9092)

### Security Settings
* **Security Protocol**: Choose the security protocol for broker communication:
  * `PLAINTEXT`: No authentication and plaintext communication
  * `SSL`: Using SSL with no authentication
  * `SASL/PLAINTEXT`: SASL authentication without encryption
  * `SASL/SSL`: SASL authentication with SSL encryption

* **Authentication** (when using SASL):
  * **Security Mechanism**: Choose the SASL mechanism:
    * `PLAIN`: Simple username/password authentication
    * `SCRAM-SHA-256`: SCRAM authentication with SHA-256
    * `SCRAM-SHA-512`: SCRAM authentication with SHA-512
  * **Username**: SASL authentication username
  * **Password**: SASL authentication password

### Topic Settings
* **Topic**: The Kafka topic where events will be published. If the topic doesn't exist, it will be created automatically with default settings.

### Message Key
Kafka partitions records by key. A key is therefore required for consistent partitioning, for log
compaction and for consumers that look up records by key. Choose one of the following modes:

* **No key**: Records are published without a key. Kafka distributes them across all partitions of
  the topic. This is the default and the behaviour of previous versions.
* **Static value**: The same key is attached to every record, e.g. `line-4`. All records of this
  sink end up in the same partition.
* **Event field**: The value of a selected event field is used as key, e.g. the field `machineId`.
  Only primitive fields can be selected. Records that share the same field value are written to the
  same partition and therefore keep their relative order.
* **Expression**: The key is built from static text and field placeholders in the form
  `#fieldName#`, e.g. `plant-1-#machineId#`. Placeholders refer to the runtime name of a field.

Keys are serialized as strings. If a key cannot be resolved for an event, e.g. because the selected
field is not part of the event, the event is not published and an error is logged. If the selected
field is empty, the record is published without a key.

### Advanced Settings
* **Additional Configurations**: Add custom Kafka producer configurations in key=value format. Each configuration should be on a new line. For example:
  ```
  buffer.memory=33554432
  batch.size=16384
  linger.ms=20
  ```

***

## Features
* **Message Handling**:
  * Automatic JSON serialization of events
  * Optional record keys from static values, event fields or expressions
  * Configurable message size limits
  * Batch processing support
  * Automatic topic creation

* **Security**:
  * SSL/TLS encryption support
  * SASL authentication with multiple mechanisms
  * Configurable security protocols

***

## Use Cases
* **Data Distribution**: Publish processed events to Kafka for other systems to consume
* **Event Streaming**: Stream events to Kafka for real-time processing
* **Data Integration**: Integrate StreamPipes with Kafka-based data pipelines

***

## Important Notes
* The sink uses the Kafka Producer API to publish messages
* Events are automatically serialized to JSON format
* Topics are created automatically if they don't exist
* For production use, it's recommended to configure appropriate security settings
* The sink supports all standard Kafka producer configurations through the additional settings
