import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  constructor(private kafkaService: KafkaService) {}

  async onModuleInit() {
    
    await this.kafkaService.subscribe(
      'transaction.completed',
      this.handleTransactionCompleted.bind(this),
    );

    
    await this.kafkaService.subscribe(
      'notification.sent',
      this.handleNotificationSent.bind(this),
    );
  }

  private async handleTransactionCompleted(message: any) {
    console.log('📨 Received transaction.completed event:', message);

    const { transactionId, userId, amount, status } = message;

    
    console.log(`Transaction ${transactionId} completed for user ${userId}`);
    console.log(`Amount: ${amount}, Status: ${status}`);
  }

  private async handleNotificationSent(message: any) {
    console.log('📨 Received notification.sent event:', message);

    const { userId, notificationType, channel } = message;
 
    console.log(`Notification sent to user ${userId} via ${channel}`);
  }
}
