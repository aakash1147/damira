import { CustomersService } from './customers.service';

describe('CustomersService historical delivery addresses', () => {
  it('creates a replacement address when an order references the address being edited', async () => {
    const address = {
      id: 'address-old',
      customerId: 'customer-1',
      addressTypeId: 'type-1',
      addressLabel: 'Home',
      contactPersonName: 'Ada Lovelace',
      contactMobile: '1234567890',
      addressLine1: 'Old street',
      addressLine2: null,
      landmark: null,
      countryId: 'country-1',
      stateId: 'state-old',
      cityId: 'city-old',
      district: null,
      postalCode: '100001',
      isDefaultBilling: true,
      isDefaultShipping: true,
    };
    const replacement = { ...address, id: 'address-new', stateId: 'state-new' };
    const tx = {
      order: { count: jest.fn().mockResolvedValue(1) },
      customerAddress: {
        updateMany: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(replacement),
      },
    };
    const prisma = {
      customerAddress: { findFirst: jest.fn().mockResolvedValue(address) },
      $transaction: jest.fn((work: (transaction: typeof tx) => unknown) => work(tx)),
    };
    const auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new CustomersService(prisma as never, auditLogs as never);

    const result = await service.updateAddress('customer-1', 'address-old', {
      stateId: 'state-new',
    });

    expect(result).toEqual(replacement);
    expect(tx.order.count).toHaveBeenCalledWith({
      where: { OR: [{ deliveryAddressId: 'address-old' }, { billingAddressId: 'address-old' }] },
    });
    expect(tx.customerAddress.update).toHaveBeenCalledWith({
      where: { id: 'address-old' },
      data: { isDeleted: true, isDefaultBilling: false, isDefaultShipping: false },
    });
    expect(tx.customerAddress.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'customer-1',
          stateId: 'state-new',
          cityId: 'city-old',
          postalCode: '100001',
        }),
      }),
    );
  });
});
