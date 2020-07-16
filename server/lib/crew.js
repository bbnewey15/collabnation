const express = require('express');
var async = require("async");

const router = express.Router();

const logger = require('../../logs');
//Handle Database
const database = require('./db');


router.post('/addCrewMember', async (req,res) => {
    var name;
    if(req.body){
        name = req.body.name;
    }

    const sql = ' INSERT INTO crew_members (member_name) VALUES (?)';

    try{
        const reponse = await database.query(sql, name);
        logger.info("Added Crew member: " + name );
        res.sendStatus(200);
    }
    catch(error){
        logger.error("Crew (addCrewMember): " + error);
        res.sendStatus(400);
    }
});

router.post('/deleteCrewMember', async (req,res) => {
    const sql = 'DELETE FROM crew_members WHERE id = ? LIMIT 1';
    var id;
    if(req.body){
        id = req.body.id;
    }
    
    try{
        const results = await database.query(sql, id);
        logger.info("Deleted crew member " + id);
        res.sendStatus(200);
    }
    catch(error){
        logger.error("Crew (deleteCrewMember): " + error);
        res.sendStatus(400);
    }
});

router.post('/updateCrewMember', async (req,res) => {
    var name, id;
    if(req.body){
        name = req.body.name;
        id = req.body.id;
    }

    const sql = 'UPDATE crew_members SET member_name = ? ' +
    ' WHERE id = ? ';
    
    try{
        const reponse = await database.query(sql, [name, id]);
        logger.info("Updated crew member to" + name);
        res.sendStatus(200);
    }
    catch(error){
        logger.error("Crews (updateCrewMember): " + error);
        res.sendStatus(400);
    }
});


router.post('/getCrewMembersByTask', async (req,res) => {
    var id;
    if(req.body){
        id = req.body.id;
    }

    const sql = ' SELECT j.id, j.task_id, j.date_assigned, m.id as m_id, m.member_name, j.job_type,   ' + 
        ' t.name, date_format(t.drill_date, \'%Y-%m-%d %H:%i:%S\') as drill_date, date_format(t.install_date, \'%Y-%m-%d %H:%i:%S\') as install_date ' + 
        ' FROM crew_jobs j ' + 
        ' LEFT JOIN crew_members m ON j.crew_members_id = m.id ' +
        ' LEFT JOIN tasks t ON j.task_id = t.id' + 
        ' WHERE task_id = ? ';

    try{
        const results = await database.query(sql, [id]);
        logger.info("Got crew members by task", id);
        res.json(results);
    }
    catch(error){
        logger.error("Crews (getCrewMembersByTask): " + error);
        res.sendStatus(400);
    }
});

router.post('/getCrewJobsByMember', async (req,res) => {
    var id;
    if(req.body){
        id = req.body.id;
    }
    if(!id){
        logger.error("Id is not valid in getCrewJobsByMember");
        res.sendStatus(400);
    }

    const sql = ' SELECT j.id, j.task_id, j.date_assigned, j.job_type, j.crew_members_id, ' + 
            ' t.name as t_name, date_format(t.drill_date, \'%Y-%m-%d %H:%i:%S\') as drill_date, date_format(t.install_date, \'%Y-%m-%d %H:%i:%S\') as install_date ' +
            ' FROM crew_jobs j ' +
            ' LEFT JOIN tasks t ON j.task_id = t.id' + 
            ' WHERE crew_members_id = ? ' ;
    
    try{
        const results = await database.query(sql, [id]);
        logger.info("Got crew jobs by member" + id);
        res.json(results);
    }
    catch(error){
        logger.error("Crews (getCrewJobsByMember): "+ id+ "  , " + error);
        res.sendStatus(400);
    }
});

router.post('/getCrewJobsByTask', async (req,res) => {
    var id;
    if(req.body){
        id = req.body.id;
    }
    if(!id){
        logger.error("Id is not valid in getCrewJobsByTask");
        res.sendStatus(400);
    }

    const sql = ' SELECT j.id, j.task_id, j.date_assigned, j.job_type, j.crew_members_id, m.member_name, m.id as m_id, ' + 
            ' t.name as t_name, date_format(t.drill_date, \'%Y-%m-%d %H:%i:%S\') as drill_date, date_format(t.install_date, \'%Y-%m-%d %H:%i:%S\') as install_date ' +
            ' FROM crew_jobs j ' +
            ' LEFT JOIN tasks t ON j.task_id = t.id' + 
            ' LEFT JOIN crew_members m ON j.crew_members_id = m.id ' +
            ' WHERE j.task_id = ? ' ;
    
    try{
        const results = await database.query(sql, [id]);
        logger.info("Got crew jobs by member" + id);
        res.json(results);
    }
    catch(error){
        logger.error("Crews (getCrewJobsByTask): "+ id+ "  , " + error);
        res.sendStatus(400);
    }
});

router.post('/getCrewJobsByTaskIds', async (req,res) => {
    var ids, job_type;
    if(req.body){
        ids = req.body.ids;
        job_type = req.body.job_type;
    }
    if(!ids || !job_type){
        logger.error("Id is not valid in getCrewJobsByTaskIds");
        res.sendStatus(400);
    }

    const sql = ' SELECT j.id, j.task_id, j.date_assigned, j.job_type, j.crew_members_id, m.member_name, m.id as m_id, ' + 
            ' t.name as t_name, date_format(t.drill_date, \'%Y-%m-%d %H:%i:%S\') as drill_date, date_format(t.install_date, \'%Y-%m-%d %H:%i:%S\') as install_date ' +
            ' FROM crew_jobs j ' +
            ' LEFT JOIN tasks t ON j.task_id = t.id' + 
            ' LEFT JOIN crew_members m ON j.crew_members_id = m.id ' +
            ' WHERE j.task_id = ? AND j.job_type = ? ' ;
    
    var all_results = [];

    async.forEachOf(ids, async (id, i, callback) => {
        //will automatically call callback after successful execution
        try{
            const results = await database.query(sql, [id, job_type]);
            all_results = [...all_results, ...results];
            return;
        }
        catch(error){
            throw error;  
        }
    }, err=> {
        if(err){
            logger.error("Crews (getCrewJobsByTaskIds): "+ ids+ " "+ job_type +"  , " + error);
            res.sendStatus(400);
        }else{
            logger.info("Got crew jobs by task ids" + ids + job_type);
            res.json(all_results);
        }
    })
});

router.post('/getCrewMembers', async (req,res) => {
    const sql = ' SELECT * FROM crew_members ' ;
    
    try{
        const results = await database.query(sql, []);
        logger.info("Got crew members");
        res.json(results);
    }
    catch(error){
        logger.error("Crews (getCrewMembers): " + error);
        res.sendStatus(400);
    }
});

router.post('/getAllCrewJobs', async (req,res) => {
    const sql = ' SELECT j.id, j.task_id, j.date_assigned, j.job_type, j.crew_members_id , ' + 
    ' m.id as m_id, m.member_name, ' + 
    ' t.name as t_name, date_format(t.drill_date, \'%Y-%m-%d %H:%i:%S\') as drill_date, date_format(t.install_date, \'%Y-%m-%d %H:%i:%S\') as install_date ' +
    ' FROM crew_jobs j ' +
    ' LEFT JOIN crew_members m ON j.crew_members_id = m.id ' +
    ' LEFT JOIN tasks t ON j.task_id = t.id';
    
    try{
        const results = await database.query(sql, []);
        logger.info("Got all crew jobs");
        res.json(results);
    }
    catch(error){
        logger.error("Crews (getAllCrewJobs): " + error);
        res.sendStatus(400);
    }
});

router.post('/deleteCrewJob', async (req,res) => {
    const sql = 'DELETE FROM crew_jobs WHERE id = ? LIMIT 1';
    var id;
    if(req.body){
        id = req.body.id;
    }
    
    try{
        const results = await database.query(sql, id);
        logger.info("Deleted crew job " + id);
        res.sendStatus(200);
    }
    catch(error){
        logger.error("Crew (deleteCrewJob): " + error);
        res.sendStatus(400);
    }
});

router.post('/updateCrewJob', async (req,res) => {
    var member_id, job_id;
    if(req.body){
        member_id = req.body.member_id;
        job_id = req.body.job_id;
    }

    const sql = 'UPDATE crew_jobs SET crew_members_id = ?, date_assigned = now() ' +
    ' WHERE id = ? ';
    
    try{
        const reponse = await database.query(sql, [member_id, job_id]);
        logger.info("Updated crew job " + job_id);
        res.sendStatus(200);
    }
    catch(error){
        logger.error("Crews (updateCrewJob): " + error);
        res.sendStatus(400);
    }
});




module.exports = router;