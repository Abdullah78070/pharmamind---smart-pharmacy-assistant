import { AppSettings, DEFAULT_SETTINGS, Invoice, CalculatedItem, Supplier, Client, ClientTransaction } from '../types';

const KEYS = {
  SETTINGS: 'pharmamind_settings',
  INVOICES: 'pharmamind_invoices',
  SUPPLIERS: 'pharmamind_suppliers',
  CLIENTS: 'pharmamind_clients',
  TRANSACTIONS: 'pharmamind_transactions',
};

export const StorageService = {
  // Settings
  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },
  
  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Suppliers
  getSuppliers: (): Supplier[] => {
    try {
      const data = localStorage.getItem(KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveSupplier: (supplier: Supplier): void => {
    const list = StorageService.getSuppliers();
    const existingIndex = list.findIndex(s => s.id === supplier.id);
    if (existingIndex >= 0) {
        list[existingIndex] = supplier;
    } else {
        list.push(supplier);
    }
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(list));
  },

  deleteSupplier: (id: string): void => {
    const list = StorageService.getSuppliers();
    const updated = list.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(updated));
  },

  // Clients
  getClients: (): Client[] => {
    try {
      const data = localStorage.getItem(KEYS.CLIENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveClient: (client: Client): void => {
    const list = StorageService.getClients();
    const existingIndex = list.findIndex(c => c.id === client.id);
    if (existingIndex >= 0) {
        list[existingIndex] = client;
    } else {
        list.push(client);
    }
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(list));
  },

  deleteClient: (id: string): void => {
    const list = StorageService.getClients();
    const updated = list.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(updated));
  },

  // Client Transactions
  getTransactions: (clientId?: string): ClientTransaction[] => {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      const all = data ? JSON.parse(data) : [];
      if (clientId) {
        return all.filter((t: ClientTransaction) => t.clientId === clientId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return all;
    } catch (e) {
      return [];
    }
  },

  addTransaction: (transaction: ClientTransaction): void => {
    const transactions = StorageService.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));

    // Update Client Balance
    const clients = StorageService.getClients();
    const clientIndex = clients.findIndex(c => c.id === transaction.clientId);
    if (clientIndex >= 0) {
        const client = clients[clientIndex];
        if (transaction.type === 'SALE') {
            client.balance += transaction.amount;
        } else {
            client.balance -= transaction.amount;
        }
        clients[clientIndex] = client;
        localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
    }
  },

  // Invoices
  getInvoices: (): Invoice[] => {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveInvoice: (invoice: Invoice): void => {
    const invoices = StorageService.getInvoices();
    // Prepend to show newest first
    const updated = [invoice, ...invoices];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
  },

  markInvoiceAsSold: (invoiceId: string, clientId: string): void => {
    const invoices = StorageService.getInvoices();
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index >= 0) {
        invoices[index].isSold = true;
        invoices[index].soldToClientId = clientId;
        invoices[index].soldDate = new Date().toISOString();
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    }
  },

  deleteInvoice: (id: string): void => {
    const invoices = StorageService.getInvoices();
    const updated = invoices.filter(inv => inv.id !== id);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
  },

  // AI Helper: Get last purchase of an item
  getLastPurchaseItem: (itemName: string): CalculatedItem | null => {
    const invoices = StorageService.getInvoices();
    // Search recent invoices first
    for (const inv of invoices) {
      const found = inv.items.find(item => item.name.trim().toLowerCase() === itemName.trim().toLowerCase());
      if (found) return found;
    }
    return null;
  },

  // AI Helper: Get last purchase of an item that specifically had a bonus
  getItemWithBonusHistory: (itemName: string): CalculatedItem | null => {
    const invoices = StorageService.getInvoices();
    for (const inv of invoices) {
      const found = inv.items.find(item => 
        item.name.trim().toLowerCase() === itemName.trim().toLowerCase() && 
        item.bonus > 0
      );
      if (found) return found;
    }
    return null;
  },

  // Helper: Get unique item names for autocomplete
  getAllItemNames: (): string[] => {
    const invoices = StorageService.getInvoices();
    const names = new Set<string>();
    invoices.forEach(inv => {
        inv.items.forEach(item => names.add(item.name));
    });
    return Array.from(names);
  },

  // --- BACKUP & RESTORE ---
  
  createBackup: (): string => {
      const backup = {
          settings: StorageService.getSettings(),
          suppliers: StorageService.getSuppliers(),
          clients: StorageService.getClients(),
          invoices: StorageService.getInvoices(),
          transactions: StorageService.getTransactions(),
          version: '1.0',
          date: new Date().toISOString()
      };
      return JSON.stringify(backup, null, 2);
  },

  restoreBackup: (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          if (!data.version) throw new Error("Invalid backup format");

          if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
          if (data.suppliers) localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(data.suppliers));
          if (data.clients) localStorage.setItem(KEYS.CLIENTS, JSON.stringify(data.clients));
          if (data.invoices) localStorage.setItem(KEYS.INVOICES, JSON.stringify(data.invoices));
          if (data.transactions) localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
          
          return true;
      } catch (e) {
          console.error("Restore Failed", e);
          return false;
      }
  }
};