import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/constants';
import { Customer, Owner, Rider } from '../entities';

export type Account = Customer | Owner | Rider;

/** 역할별 계정 테이블(customer / owner / rider)을 한 곳에서 다룬다 */
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Owner) private readonly owners: Repository<Owner>,
    @InjectRepository(Rider) private readonly riders: Repository<Rider>,
  ) {}

  repo(role: Role): Repository<Account> {
    if (role === 'CUSTOMER') return this.customers as Repository<Account>;
    if (role === 'OWNER') return this.owners as Repository<Account>;
    return this.riders as Repository<Account>;
  }

  findById(role: Role, id: number) {
    return this.repo(role).findOneBy({ id });
  }

  findByEmail(role: Role, email: string) {
    return this.repo(role).findOneBy({ email });
  }
}
