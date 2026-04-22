import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import {
  PaginatedResult,
  VoucherTableItem,
  WorkerModel,
} from '../../../shared/models/voucher.model';

@Injectable({ providedIn: 'root' })
export class WorkerDataService {
  private readonly api = inject(ApiService);

  getWorkers(params?: Record<string, string | number | boolean>): Observable<PaginatedResult<WorkerModel>> {
    return this.api.getWorkers(params);
  }

  getWorker(id: string): Observable<WorkerModel> {
    return this.api.getWorker(id);
  }

  getWorkerVouchers(workerId: string): Observable<PaginatedResult<VoucherTableItem>> {
    return this.api.getVouchers({ workerId });
  }
}
