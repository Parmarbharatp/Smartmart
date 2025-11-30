import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { Order } from '../models/Order.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

/**
 * Distribute revenue after order delivery
 * Shop Owner: 80%, Delivery Boy: 10%, Admin: 10%
 */
export async function distributeRevenue(orderId) {
  try {
    // Fetch order fresh from database to ensure we have latest data
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Only distribute if order is delivered and paid
    if (order.status !== 'delivered' || order.paymentStatus !== 'paid') {
      console.log('Order not ready for revenue distribution:', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryBoyId: order.deliveryBoyId
      });
      throw new Error('Order must be delivered and paid before revenue distribution');
    }

    // Populate shop to get ownerId
    await order.populate('shopId');
    
    // Check if delivery boy is assigned
    if (!order.deliveryBoyId) {
      console.log('Warning: Order delivered but no delivery boy assigned:', orderId);
    }

    // Check if revenue already distributed (prevent double distribution)
    const existingTransaction = await Transaction.findOne({
      orderId: order._id,
      revenueType: { $in: ['shop_owner', 'delivery_boy', 'admin'] }
    });

    if (existingTransaction) {
      console.log('Revenue already distributed for order:', orderId);
      return { alreadyDistributed: true };
    }

    const totalAmount = order.totalAmount;
    const deliveryCharge = order.shippingCost || 0; // Delivery charge (₹30 for orders < ₹100)
    const orderAmountWithoutDelivery = totalAmount - deliveryCharge; // Amount before delivery charge
    
    // Get percentages from config or use defaults
    const shopOwnerPercentage = parseFloat(process.env.SHOP_OWNER_PERCENTAGE) || 80;
    const deliveryBoyPercentage = parseFloat(process.env.DELIVERY_BOY_PERCENTAGE) || 10;
    const adminPercentage = parseFloat(process.env.ADMIN_PERCENTAGE) || 10;

    // Calculate revenue split on order amount (excluding delivery charge)
    let shopOwnerAmount = Math.round((orderAmountWithoutDelivery * shopOwnerPercentage) / 100);
    let deliveryBoyAmount = Math.round((orderAmountWithoutDelivery * deliveryBoyPercentage) / 100);
    let adminAmount = Math.round((orderAmountWithoutDelivery * adminPercentage) / 100);
    
    // Add delivery charge to delivery boy's share
    if (deliveryCharge > 0) {
      deliveryBoyAmount += deliveryCharge;
      console.log(`Delivery charge of ₹${deliveryCharge} added to delivery boy's earnings`);
    }

    // Verify total matches (with rounding tolerance)
    const distributedTotal = shopOwnerAmount + deliveryBoyAmount + adminAmount;
    if (Math.abs(distributedTotal - totalAmount) > 1) {
      // Adjust admin amount to account for rounding
      adminAmount = totalAmount - shopOwnerAmount - deliveryBoyAmount;
    }

    // Get shop owner ID
    const shop = await Shop.findById(order.shopId);
    if (!shop || !shop.ownerId) {
      throw new Error('Shop owner not found');
    }

    const shopOwnerId = shop.ownerId;
    const deliveryBoyId = order.deliveryBoyId || null;
    
    // If no delivery boy assigned, admin gets the delivery boy's share too
    if (!deliveryBoyId) {
      adminAmount += deliveryBoyAmount;
      deliveryBoyAmount = 0;
    }

    // Get admin user (first admin found)
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    const results = {};

    // 1. Credit Shop Owner (80%)
    if (shopOwnerAmount > 0) {
      const shopOwnerWallet = await Wallet.getOrCreateWallet(shopOwnerId);
      const balanceBefore = shopOwnerWallet.balance;
      await shopOwnerWallet.addBalance(
        shopOwnerAmount,
        `Revenue from order ${order.orderNumber}`
      );
      const balanceAfter = shopOwnerWallet.balance;

      await Transaction.createCredit({
        userId: shopOwnerId,
        orderId: order._id,
        amount: shopOwnerAmount,
        currency: 'INR',
        description: `Shop revenue (${shopOwnerPercentage}%) from order ${order.orderNumber}`,
        revenueType: 'shop_owner',
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        gatewayTransactionId: `REV-${order.orderNumber}-SHOP`
      });

      results.shopOwner = {
        userId: shopOwnerId,
        amount: shopOwnerAmount,
        balanceAfter: balanceAfter
      };
    }

    // 2. Credit Delivery Boy (10%)
    if (deliveryBoyAmount > 0 && deliveryBoyId) {
      try {
        // Convert to string if it's an ObjectId
        const deliveryBoyIdStr = deliveryBoyId.toString ? deliveryBoyId.toString() : deliveryBoyId;
        
        const deliveryBoyWallet = await Wallet.getOrCreateWallet(deliveryBoyIdStr);
        const balanceBefore = deliveryBoyWallet.balance;
        await deliveryBoyWallet.addBalance(
          deliveryBoyAmount,
          `Delivery fee from order ${order.orderNumber}`
        );
        const balanceAfter = deliveryBoyWallet.balance;

        // Create description with delivery charge info if applicable
        let description = `Delivery fee (${deliveryBoyPercentage}%) from order ${order.orderNumber}`;
        if (deliveryCharge > 0) {
          const baseAmount = deliveryBoyAmount - deliveryCharge;
          description = `Delivery fee (₹${baseAmount.toFixed(2)} + ₹${deliveryCharge.toFixed(2)} delivery charge) from order ${order.orderNumber}`;
        }
        
        await Transaction.createCredit({
          userId: deliveryBoyIdStr,
          orderId: order._id,
          amount: deliveryBoyAmount,
          currency: 'INR',
          description: description,
          revenueType: 'delivery_boy',
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          gatewayTransactionId: `REV-${order.orderNumber}-DELIVERY`
        });

        results.deliveryBoy = {
          userId: deliveryBoyIdStr,
          amount: deliveryBoyAmount,
          balanceAfter: balanceAfter
        };
        
        console.log('Delivery boy credited:', {
          deliveryBoyId: deliveryBoyIdStr,
          amount: deliveryBoyAmount,
          orderNumber: order.orderNumber
        });
      } catch (error) {
        console.error('Error crediting delivery boy:', error);
        // Don't throw - continue with shop owner and admin distribution
      }
    } else {
      console.log('Skipping delivery boy credit:', {
        deliveryBoyAmount,
        deliveryBoyId,
        hasDeliveryBoy: !!deliveryBoyId
      });
    }

    // 3. Credit Admin (10%)
    if (adminAmount > 0) {
      const adminWallet = await Wallet.getOrCreateWallet(adminUser._id);
      const balanceBefore = adminWallet.balance;
      await adminWallet.addBalance(
        adminAmount,
        `Platform commission from order ${order.orderNumber}`
      );
      const balanceAfter = adminWallet.balance;

      await Transaction.createCredit({
        userId: adminUser._id,
        orderId: order._id,
        amount: adminAmount,
        currency: 'INR',
        description: `Platform commission (${adminPercentage}%) from order ${order.orderNumber}`,
        revenueType: 'admin',
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        gatewayTransactionId: `REV-${order.orderNumber}-ADMIN`
      });

      results.admin = {
        userId: adminUser._id,
        amount: adminAmount,
        balanceAfter: balanceAfter
      };
    }

    console.log('Revenue distributed successfully for order:', orderId, results);

    return {
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: totalAmount,
      distribution: {
        shopOwner: results.shopOwner,
        deliveryBoy: results.deliveryBoy,
        admin: results.admin
      }
    };
  } catch (error) {
    console.error('Revenue distribution error:', error);
    throw error;
  }
}

