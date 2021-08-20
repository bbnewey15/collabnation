import React, {useRef, useState, useEffect, createContext, useContext} from 'react';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import {AppBar, Tabs, Tab, Typography, Box} from '@material-ui/core';

import EventIcon from '@material-ui/icons/Event';
import TaskIcon from '@material-ui/icons/Assignment';
import MapIcon from '@material-ui/icons/Map';
import ViewListIcon from '@material-ui/icons/ViewList';
import CrewIcon from '@material-ui/icons/Group';
import { ProfileContext } from '../ProfileContainer';

function TabPanel(props) {
  const {classes, children, tabValue, index, ...other } = props;
  
  console.log("Tab Panel props", props);

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={tabValue !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {tabValue === index && <Box className={classes.tab_box} p={2}>{children}</Box>}
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  tabValue: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}



export default function ProfileTabs({children}) {
  const classes = useStyles();
  const theme = useTheme();
 
  const {currentView , setCurrentView, views, user} = useContext(ProfileContext);
  

  const handleChange = (event, newValue) => {
    setCurrentView(views.find((view)=> view.index === newValue));
  };

  if(currentView?.index == null){
    return(<></>);
  }

  const tabs = views.filter((item)=> {
    if(item.adminOnly == false || item.adminOnly == undefined){
      return true;
    }

    return user.isAdmin == item.adminOnly 
  })

  return (
    <div className={classes.root}>
      <AppBar position="static" color="default" className={classes.appbar}> 
        <Tabs
          tabValue={currentView?.index}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="full width tabs example"
          className={classes.tabRoot}
        >
            { tabs?.map((view,i)=>{
                    const selectedView = view.value === currentView?.value;
                    return (
                        <Tab className={selectedView ? classes.selectedTabSmall : classes.nonSelectedTabSmall} 
                    label={ <span className={classes.tabSpan}>
                                <EventIcon className={classes.icon}/>
                                    <Box display={{ xs: 'none', md: 'inline' }}  component="span">{view.displayName}</Box>
                            </span>} {...a11yProps(currentView.index)} />
                    )
            })}
        </Tabs>
      </AppBar>
    {children.find((child, i)=> currentView.index === i)}
    </div>
  );
}

const useStyles = makeStyles(theme => ({
  //[theme.breakpoints.down('sm')]: sm, md, lg
  root: {
    width: '100%',
    backgroundColor: '#999',
    '& header':{
      marginTop: '0%',
    },
  },
  appbar:{
    background: '#ddb567',
  },
  icon:{
      margin: '2px 6px -3px 6px',
      color: '#a0a0a0',
  },
  tabSpan: {
    fontSize: '16px',
    fontWeight: '500',
  },
  selectedTab: {
    flexGrow : '2',
    boxShadow: 'inset 1px 2px 6px 0px #414d5a',
    color: '#d87904 !important',
    backgroundColor: '#ffedc4',
    padding: '10px',
    minHeight: '0px',
    lineHeight: '1',
    maxWidth: '150px',
  },
  nonSelectedTab: {
    flexGrow : '2',
    boxShadow:' -1px 1px 2px 0px #414d5a',
    
    '&:hover':{
      backgroundColor: '#fff',
      borderTop: '2px solid #a2ceff',
      borderBottom: '2px solid #a2ceff',
      color: '#d87904',
    },
    maxWidth: '150px',
    minHeight: '0px',
    lineHeight: '1',
  },
  selectedTabSmall: {
    maxWidth: '150px',
    flexGrow : '1',
    boxShadow: 'inset 1px 2px 6px 0px #414d5a',
    color: '#d87904 !important',
    backgroundColor: '#5d5d5d',
    padding: '10px',
    minHeight: '0px',
    lineHeight: '1',
  },
  nonSelectedTabSmall: {
    maxWidth: '150px',
    boxShadow:' -1px 1px 2px 0px #414d5a',
    flexGrow : '1',
    '&:hover':{
      backgroundColor: '#fff',
      borderTop: '2px solid #a2ceff',
      borderBottom: '2px solid #a2ceff',
      color: '#d87904',
    },
    minHeight: '0px',
    lineHeight: '1',
    background: 'linear-gradient(0deg, #c2c2c2, white)',
  },
  tab:{
    // backgroundColor: '#f5f5f5',

    // margin: '1% 2%',
  },
  tabRoot:{
    minHeight: '0px',
  },
  tabWindowRoot:{
    minHeight: '0px',
  },
  p_selected:{
    margin: '0px 0px',
    padding: '0px 10px',
    position: 'absolute',
    bottom: '.75em',
    color: 'rgb(255, 237, 196)',
    fontSize: '12px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: '75%',
    backgroundColor: '#65aea4',
    borderRadius: '2px',
    boxShadow: 'inset 0px 1px 5px 0px rgba(0,0,0,0.2)',
  },
  test:{
    padding: '10px',
  },
  tab_box:{
    padding: '.5%',
    overflow: 'hidden',
  }
}));