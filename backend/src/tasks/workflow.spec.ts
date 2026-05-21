import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { assertTaskTransition } from './workflow';

describe('task workflow', () => {
  const customerId = 'customer';
  const executorId = 'executor';

  it('allows executor to send in_progress task to review', () => {
    expect(() =>
      assertTaskTransition({ status: TaskStatus.in_progress, customerId, executorId }, executorId, TaskStatus.on_review),
    ).not.toThrow();
  });

  it('rejects status jumps', () => {
    expect(() =>
      assertTaskTransition({ status: TaskStatus.published, customerId, executorId: null }, customerId, TaskStatus.in_progress),
    ).toThrow(BadRequestException);
  });

  it('prevents executor from completing task', () => {
    expect(() =>
      assertTaskTransition({ status: TaskStatus.on_review, customerId, executorId }, executorId, TaskStatus.completed),
    ).toThrow(ForbiddenException);
  });

  it('allows customer to request rework from review', () => {
    expect(() =>
      assertTaskTransition({ status: TaskStatus.on_review, customerId, executorId }, customerId, TaskStatus.in_progress, true),
    ).not.toThrow();
  });
});
