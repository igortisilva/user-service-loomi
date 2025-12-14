import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID', 'user-service'),
      brokers: [this.configService.get('KAFKA_BROKER', 'localhost:9092')],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.configService.get('KAFKA_GROUP_ID', 'user-service-group'),
    });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    console.log('✅ Kafka connected successfully');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async publish(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(`📤 Message published to topic ${topic}`);
    } catch (error) {
      console.error('Error publishing message to Kafka:', error);
      throw error;
    }
  }

  async subscribe(topic: string, callback: (message: any) => void): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();
        if (value) {
          const parsedMessage = JSON.parse(value);
          console.log(`📥 Message received from topic ${topic}:`, parsedMessage);
          callback(parsedMessage);
        }
      },
    });
  }

  async publishUserUpdated(userId: string, updateData: any): Promise<void> {
    await this.publish('user.updated', {
      userId,
      updateData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishBankingDetailsUpdated(userId: string, bankingDetails: any): Promise<void> {
    await this.publish('user.banking-details.updated', {
      userId,
      bankingDetails,
      timestamp: new Date().toISOString(),
    });
  }
}
