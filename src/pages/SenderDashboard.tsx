import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  FileText,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Shipment {
  id: string;
  trackingId: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  pickupAddress: string;
  dropAddress: string;
  senderName: string;
  receiverName: string;
  driverName: string;
  vehicleNumber: string;
  estimatedTime: string;
  createdAt: string;
}

const mockShipments: Shipment[] = [
  {
    id: '1',
    trackingId: 'BL-2024-001234',
    status: 'IN_TRANSIT',
    pickupAddress: '123 Warehouse District, Mumbai',
    dropAddress: '456 Business Park, Andheri East',
    senderName: 'Sunrise Logistics',
    receiverName: 'Rahul Sharma',
    driverName: 'Amit Kumar',
    vehicleNumber: 'MH 02 AB 1234',
    estimatedTime: '35 mins',
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    trackingId: 'BL-2024-001235',
    status: 'DELIVERED',
    pickupAddress: '789 Industrial Zone, Thane',
    dropAddress: '321 Tech Park, Powai',
    senderName: 'Quick Ship Ltd',
    receiverName: 'Priya Patel',
    driverName: 'Vijay Singh',
    vehicleNumber: 'MH 04 CD 5678',
    estimatedTime: 'Delivered',
    createdAt: '2024-01-09',
  },
  {
    id: '3',
    trackingId: 'BL-2024-001236',
    status: 'PENDING',
    pickupAddress: '555 Cargo Bay, Navi Mumbai',
    dropAddress: '888 Mall Road, Juhu',
    senderName: 'Express Movers',
    receiverName: 'Amit Desai',
    driverName: 'Pending Assignment',
    vehicleNumber: '-',
    estimatedTime: 'Awaiting Pickup',
    createdAt: '2024-01-10',
  },
];

const SenderDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const filteredShipments = mockShipments.filter(
    (s) =>
      s.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Pending</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="transit">In Transit</Badge>;
      case 'DELIVERED':
        return <Badge variant="delivered">Delivered</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Sender Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Track your shipments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 grid lg:grid-cols-3 gap-6">
        {/* Shipments List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking ID or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Shipments */}
          <div className="space-y-3">
            {filteredShipments.map((shipment, index) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedShipment?.id === shipment.id ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => setSelectedShipment(shipment)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono font-bold text-sm">{shipment.trackingId}</p>
                        <p className="text-xs text-muted-foreground">{shipment.createdAt}</p>
                      </div>
                      {getStatusBadge(shipment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">From</p>
                        <p className="font-medium truncate">{shipment.pickupAddress}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">To</p>
                        <p className="font-medium truncate">{shipment.dropAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span>{shipment.driverName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <Clock className="w-4 h-4" />
                        <span>{shipment.estimatedTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Tracking Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-accent" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedShipment ? (
                <div className="space-y-4">
                  {/* Map placeholder */}
                  <div className="map-container h-48 relative rounded-lg">
                    <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto text-accent mb-2" />
                        <p className="text-sm text-muted-foreground">Live map view</p>
                      </div>
                    </div>
                    {selectedShipment.status === 'IN_TRANSIT' && (
                      <motion.div 
                        className="absolute left-1/4 top-1/2 -translate-y-1/2"
                        animate={{ x: [0, 20, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg">
                          <Truck className="w-5 h-5 text-accent-foreground" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Shipment Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ETA</span>
                      <span className="font-medium">{selectedShipment.estimatedTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Driver</span>
                      <span className="font-medium">{selectedShipment.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vehicle</span>
                      <span className="font-mono text-sm">{selectedShipment.vehicleNumber}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 gap-2" size="sm">
                      <Phone className="w-4 h-4" />
                      Call Driver
                    </Button>
                    {selectedShipment.status === 'DELIVERED' && (
                      <Button variant="accent" className="flex-1 gap-2" size="sm">
                        <FileText className="w-4 h-4" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select a shipment to track</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SenderDashboard;
