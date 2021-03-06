import React from 'react';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {AppBar, Tabs, Tab, Typography, Box} from '@material-ui/core';

import TaskIcon from '@material-ui/icons/Assignment';
import MapIcon from '@material-ui/icons/Map';
import ViewListIcon from '@material-ui/icons/ViewList';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={2}>{children}</Box>}
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}



export default function FullWidthTabs({children, value, setValue}) {
  const classes = useStyles();
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = index => {
    setValue(index);
  };

  return (
    <div className={classes.root}>
      <AppBar position="static" color="default">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="full width tabs example"
          
        >
          <Tab className={value === 0 ? classes.selectedTab : classes.nonSelectedTab} label={ <span className={classes.tabSpan}><TaskIcon className={ classes.icon}/>&nbsp;Work Orders</span>} {...a11yProps(0)} />
          <Tab className={value === 1 ? classes.selectedTab : classes.nonSelectedTab} label={ <span className={classes.tabSpan}><ViewListIcon className={classes.icon}/>&nbsp;PDF List View</span>} {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={value}
        onChangeIndex={handleChangeIndex}
      >
     
         {children.map((child, index) => (   <TabPanel className={classes.tab} key={index} value={value} index={index} dir={theme.direction}>
            {child}
          </TabPanel>
         ))}
       
  
      </SwipeableViews>
    </div>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
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
    minHeight: '0px',
    lineHeight: '1',
  },
  tab:{
    backgroundColor: '#e7eff2',
  }
}));