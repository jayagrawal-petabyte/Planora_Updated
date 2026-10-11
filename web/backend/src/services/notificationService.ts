import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export const startCronJobs = () => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily cron job to check for tasks due tomorrow...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
      const tasksDueTomorrow = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: startOfTomorrow,
            lte: endOfTomorrow
          },
          status: {
            not: 'COMPLETED'
          }
        },
        include: {
          user: true
        }
      });

      const messages: any[] = [];

      for (const task of tasksDueTomorrow) {
        if (task.user.pushToken && Expo.isExpoPushToken(task.user.pushToken)) {
          messages.push({
            to: task.user.pushToken,
            sound: 'default',
            title: 'Task Due Tomorrow',
            body: `Your task "${task.name}" is due tomorrow!`,
            data: { taskId: task.id },
          });
        }
      }

      if (messages.length > 0) {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Error sending push notification chunk:', error);
          }
        }
        console.log(`Sent ${messages.length} push notifications.`);
      }
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });
};
