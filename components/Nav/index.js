import Link from 'next/link'
//import styled from 'styled-components'
//import { borderBottom } from '@material-ui/system';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

import {withRouter} from "next/router";
import NavButton from '../Nav/NavButton';
import {Box, Drawer,List,Divider,ListItem, ListItemIcon, ListItemText} from '@material-ui/core';

/*`
  display: flex;
  background: #414d5a;  
`*/

const Nav = (props) => {

  const useStyles = makeStyles(theme => ({
    root: {
      display: 'flex',
      background: '#7e7e7e',
      
      boxShadow: 'inset 0px 2px 4px -1px rgba(0,0,0,0.2), inset 0px 4px 5px 0px rgba(0,0,0,0.14), inset 0px 1px 10px 0px rgba(0,0,0,0.12)'
    },
    toolbar: {
      minHeight: '60px',
    },
    button: {
      cursor: 'pointer',
      
    },
    list:{

    },
    listItem:{
      border: '1px solid #ececec',
      padding: '0% 20%'
    },
    nav_div:{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }
    
   
  }));

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleOpenDrawer = (event) =>{
    setDrawerOpen(true);
  }

  const closeDrawer = (event) =>{
    setDrawerOpen(false);
  }

  //only works inside a functional component
  const classes = useStyles();

  return(
  <AppBar position="static" classes={{root: classes.root}}>
    <Toolbar className={classes.toolbar}>
          <Box display={{ xs: 'inline', md: 'none' }}  component="span">
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={event=> handleOpenDrawer(event)}>
            <MenuIcon />
          </IconButton>
          <Drawer anchor={'left'} open={drawerOpen} onClose={event => closeDrawer(event)}>
            <List className={classes.list}>
                {props.navButtons.map((button,i) => (
                  <ListItem key={`drawer_button_${i}`} className={classes.listItem}>
                      <Link href={button.path} as={`/scheduling/${button.path}`}><h3>{button.label}</h3></Link>
                  </ListItem>
                ))}
            </List>
          </Drawer>
          </Box>
          <div className={classes.nav_div}>
          {props.navButtons.map((button, i) => (
            <Box key={`button_${i}`} display={{ xs: 'none', md: 'inline' }}  component="span">
          <NavButton className={classes.button}
            key={button.path}
            path={button.path}
            label={button.label}
          /></Box>
          ))}
          </div>
        </Toolbar>    
  </AppBar>
  )
}

export default Nav