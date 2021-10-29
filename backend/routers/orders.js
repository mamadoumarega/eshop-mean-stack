const {Order} = require('../models/order');
const express = require('express');
const {OrderItem} = require("../models/order-item");
const router = express.Router();


router.get('/', async (req, res) => {
   const orderList = await Order.find().populate('user', 'name').sort({'dateOrder': -1});

   if(!orderList) {
       return res.status(500).json({success: false});
   }
   res.send(orderList);
});

router.post('/', async (req, res) => {

    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id
    }));
    const orderItemsIdsResolved = await orderItemsIds;
    //console.log(orderItemsIdsResolved);

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        return orderItem.product.price * orderItem.quantity;
    }));

    //console.log(totalPrices);

    const totalPrice = totalPrices.reduce((a,b) => a + b, 0);
    //console.log(totalPrice);

    let newOrder = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    });
    newOrder = await newOrder.save();

    if(!newOrder)
        return res.status(404).send('the order cannot be created!');

    res.send(newOrder);
});

router.get('/:id', async (req, res) => {

    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate:
                { path: 'product', populate: 'category'}
        })
    ;

    if(!order) {
        return res.status(500).json({success: false, message: 'Order with this id not found'});
    }
    res.send(order);

});

router.put('/:id', async (req, res) => {
    let order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        {new: true}
    )

    order = await order.save();

    if(!order)
        return res.status(404).send('the order cannot be created!');
    res.send(order);
});

router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order=> {
        if (order) {
            order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false, message: 'order not found!'})
        }
    }).catch((err) => {
        return res.status(400).json({success: false, error: err})
    });
});

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ]);

    if(!totalSales) {
       return  res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalSales : totalSales.pop().totalsales});
});

router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments();

    if(!orderCount) {
        return res.status(500).json({success: false})
    }

    res.send({
        orderCount: orderCount
    })

});

router.get('/get/usersorders/:userid', async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid }).populate({
        path: 'orderItems', populate:  {
            path: 'product', populate: 'category'
        }}).sort({'dateOrder': -1})
    ;

    if(!userOrderList) {
        return res.status(500).json({success: false});
    }
    res.send(userOrderList);
});


module.exports = router;
