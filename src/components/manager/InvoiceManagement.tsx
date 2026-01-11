import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileText, Download, Search, Filter, CheckCircle2, Clock, IndianRupee, Package, Calendar, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Invoice {
  id: string;
  invoice_number: string;
  shipment_id: string;
  sender_id: string | null;
  amount: number;
  tax_amount: number | null;
  total_amount: number;
  is_paid: boolean | null;
  paid_at: string | null;
  created_at: string;
  shipment?: {
    tracking_id: string;
    pickup_city: string;
    delivery_city: string;
    receiver_name: string;
    package_type: string;
    weight: number | null;
  };
}

const InvoiceManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['manager-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          shipment:shipments(
            tracking_id,
            pickup_city,
            delivery_city,
            receiver_name,
            package_type,
            weight
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.shipment?.tracking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.shipment?.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice.is_paid) ||
      (statusFilter === 'unpaid' && !invoice.is_paid);

    return matchesSearch && matchesStatus;
  });

  const paidInvoices = invoices.filter((i) => i.is_paid);
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalTax = paidInvoices.reduce((sum, i) => sum + (i.tax_amount || 0), 0);

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colors
    const primaryColor: [number, number, number] = [249, 115, 22]; // Orange
    const darkColor: [number, number, number] = [31, 41, 55];
    const grayColor: [number, number, number] = [107, 114, 128];
    const lightGray: [number, number, number] = [243, 244, 246];

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ROUTEZY', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Logistics & Delivery Solutions', 20, 33);

    // Invoice title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth - 20, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, pageWidth - 20, 33, { align: 'right' });

    // Invoice details section
    let yPos = 60;
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    
    // Left column - Invoice info
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(invoice.created_at), 'dd MMMM yyyy'), 55, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 20, yPos);
    
    if (invoice.is_paid) {
      doc.setTextColor(34, 197, 94);
      doc.text('PAID', 55, yPos);
    } else {
      doc.setTextColor(249, 115, 22);
      doc.text('UNPAID', 55, yPos);
    }
    doc.setTextColor(...darkColor);
    
    if (invoice.paid_at) {
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Paid On:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(invoice.paid_at), 'dd MMM yyyy, hh:mm a'), 55, yPos);
    }

    // Shipment Details Box
    yPos += 20;
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 55, 3, 3, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPMENT DETAILS', 20, yPos + 5);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    yPos += 15;
    
    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Tracking ID:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.shipment?.tracking_id || 'N/A', 55, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Receiver:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.shipment?.receiver_name || 'N/A', 140, yPos);
    
    yPos += 10;
    
    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Route:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.shipment?.pickup_city || 'N/A'} → ${invoice.shipment?.delivery_city || 'N/A'}`, 55, yPos);
    
    yPos += 10;
    
    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('Package:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.shipment?.package_type || 'N/A'} • ${invoice.shipment?.weight || 'N/A'} kg`, 55, yPos);

    // Billing Details
    yPos += 30;
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLING DETAILS', 20, yPos);
    
    yPos += 10;
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    yPos += 10;
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 20, yPos);
    doc.text(`₹${invoice.amount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setTextColor(...grayColor);
    doc.text('GST (18%)', 20, yPos);
    doc.text(`₹${(invoice.tax_amount || 0).toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 5;
    doc.setDrawColor(...grayColor);
    doc.line(pageWidth - 80, yPos, pageWidth - 15, yPos);
    
    yPos += 10;
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount', 20, yPos);
    doc.setTextColor(...primaryColor);
    doc.text(`₹${invoice.total_amount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFillColor(...lightGray);
    doc.rect(0, footerY - 5, pageWidth, 40, 'F');
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing Routezy Logistics!', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('For support: support@routezy.com | 1800-XXX-XXXX', pageWidth / 2, footerY + 12, { align: 'center' });
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY + 19, { align: 'center' });

    // Save the PDF
    doc.save(`${invoice.invoice_number}.pdf`);
    toast.success('Invoice PDF downloaded successfully');
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-bold">{paidInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10">
                <IndianRupee className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <IndianRupee className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tax Collected</p>
                <p className="text-2xl font-bold">₹{totalTax.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Invoice Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, tracking ID, or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {invoice.shipment?.tracking_id || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span>{invoice.shipment?.pickup_city || 'N/A'}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{invoice.shipment?.delivery_city || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.shipment?.receiver_name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{invoice.total_amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {invoice.is_paid ? (
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                            <Clock className="w-3 h-3 mr-1" />
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(invoice.created_at), 'dd MMM yyyy')}</div>
                          {invoice.paid_at && (
                            <div className="text-xs text-muted-foreground">
                              Paid: {format(new Date(invoice.paid_at), 'dd MMM')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintInvoice(invoice)}
                            title="Preview Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generateInvoicePDF(invoice)}
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl print:max-w-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 p-6 bg-white text-black rounded-lg print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-primary">ROUTEZY</h2>
                  <p className="text-sm text-gray-500">Logistics & Delivery</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-semibold">TAX INVOICE</h3>
                  <p className="text-sm text-gray-500">{selectedInvoice.invoice_number}</p>
                </div>
              </div>

              <Separator />

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Invoice Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.created_at), 'dd MMMM yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <Badge className={selectedInvoice.is_paid ? 'bg-green-500' : 'bg-orange-500'}>
                    {selectedInvoice.is_paid ? 'PAID' : 'UNPAID'}
                  </Badge>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Shipment Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tracking ID</p>
                    <p className="font-mono">{selectedInvoice.shipment?.tracking_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Receiver</p>
                    <p>{selectedInvoice.shipment?.receiver_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Route</p>
                    <p>{selectedInvoice.shipment?.pickup_city} → {selectedInvoice.shipment?.delivery_city}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Package</p>
                    <p>{selectedInvoice.shipment?.package_type} • {selectedInvoice.shipment?.weight} kg</p>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{selectedInvoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (18%)</span>
                  <span>₹{(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{selectedInvoice.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.paid_at && (
                <div className="text-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Paid on {format(new Date(selectedInvoice.paid_at), 'dd MMMM yyyy, hh:mm a')}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 print:hidden">
                <Button onClick={printInvoice} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateInvoicePDF(selectedInvoice)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManagement;
