const express = require('express');
const router = express.Router();

const logger = require('../../logs');
//Handle Database
const database = require('./db');

router.get('/getAllWorkOrders', async (req,res) => {
    const sql = 'SELECT DISTINCT wo.record_id AS wo_record_id, date, wo.type AS wo_type, organization AS account, wo.city AS wo_city, wo.state AS wo_state, description, customer, account_id, ' +
    ' wo.customer_id AS wo_customer_id, a.name AS a_name, c.name AS c_name, sa.city AS sa_city, sa.state AS sa_state ' +
    ' FROM work_orders wo ' +
    ' LEFT JOIN entities a ON wo.account_id = a.record_id ' +
    ' LEFT JOIN entities_addresses sa ON a.record_id = sa.entities_id AND sa.main = 1 ' +
    ' LEFT JOIN entities c ON wo.customer_id = c.record_id ' +
    ' limit 1000 ';
    try{
        const results = await database.query(sql, []);
        logger.info("Got Work Orders");
        res.json(results);
    }
    catch(error){
        logger.error("Work Orders: " + error);
        res.send("");
    }
});

router.post('/getAllWorkOrderItems', async (req,res) => {

    var search_query, table;
    if(req.body){
        if(req.body.search_query != null){
            search_query = "%" + req.body.search_query + "%";
        }else{
            search_query = "%";
        }

        if(req.body.table != null){
            table = req.body.table;
        }else{
            return;
        }
        
    }
    logger.info(table);
    logger.info(search_query);
    

    const sql = 'SELECT woi.*, wo.job_reference, e.name as e_name, date_format(wo.date, \'%m-%d-%Y %H:%i:%S\') as date '  + 
        ' FROM work_orders_items woi ' +
        ' LEFT JOIN work_orders wo ON woi.work_order=wo.record_id ' + 
        ' LEFT JOIN entities e ON wo.account_id=e.record_id ' + 
        ' WHERE ?? like ? ' +
        ' ORDER BY woi.work_order DESC ' + 
        ' LIMIT 100';

    try{
        const results = await database.query(sql, [table, search_query]);
        logger.info("Got Work Order Items");
        logger.info(JSON.stringify(results));
        res.json(results);

    }
    catch(error){
        logger.error("Work Order Items: " + error);
        res.send("");
    }
});


module.exports = router;