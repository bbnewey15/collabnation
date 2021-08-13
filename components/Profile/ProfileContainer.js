import React, {useRef, useState, useEffect, createContext} from 'react';
import {makeStyles, CircularProgress, Grid} from '@material-ui/core';


import cogoToast from 'cogo-toast';
import {createSorter} from '../../js/Sort';

import Util from '../../js/Util';
import Settings from '../../js/Settings';

import ProfileTabs from './components/ProfileTabs';

//Page Panels
import ProfileMainContainer from './ProfileMain/ProfileMainContainer';
import _ from 'lodash';


export const ProfileContext = createContext(null);

//This is the highest component for the Profile Page
//Contains all important props that all tabs use
const ProfileContainer = function(props) {
  const {user} = props;

  //views used through whole inventory app, 
  const views = [ { value: "profileMain", displayName: "Profile", index: 0 },
                    { value: "profileSettings", displayName: "Settings", index: 1 },
                  ];

  const [currentView,setCurrentView] = useState(null);

  //Parts

  const classes = useStyles();

  //Get View from local storage if possible || kit default
  useEffect(() => {
    if(currentView == null){
      var tmp = window.localStorage.getItem('currentProfileView');
      var tmpParsed;
      if(tmp){
        tmpParsed = JSON.parse(tmp);
      }
      if(tmpParsed){
        var view = views.find((v)=> v.value == tmpParsed);

        //admin check
        if(view.adminOnly && user.isAdmin != true ){
          //no access - change to any allowed view
          view = views.find((v)=> !v.isAdmin);
        }
        setCurrentView(view || views.find((v)=> !v.isAdmin));
      }else{
        setCurrentView(views.find((v)=> !v.isAdmin));
      }
    }
    if(currentView){
      window.localStorage.setItem('currentProfileView', JSON.stringify(currentView.value));
    }
    
  }, [currentView]);


  const getProfilePages = () =>{
    let tabs = views.filter((item)=> {
      if(item.adminOnly == false || item.adminOnly == undefined){
        return true;
      }

      return user.isAdmin == item.adminOnly 
    })
    return tabs.map((tab, i)=>{
      
        switch(tab.value){
          case "profileMain":
            return <ProfileMainContainer key={`${i}_inv_tab`} user={user}/>
            break;
          default: 
            cogoToast.error("Bad view");
            return <ProfileMainContainer key={`${i}_inv_tab`} user={user}/>;
            break;
        }
    })
    
  }
  

  return (
    <div className={classes.root}>
      <ProfileContext.Provider value={{user,currentView, setCurrentView, views} } >
      
        <div className={classes.containerDiv}>
        
        <ProfileTabs >
              { currentView && getProfilePages()}
         </ProfileTabs>

        </div>
      </ProfileContext.Provider>
    </div>
  );
}

export default ProfileContainer

const useStyles = makeStyles(theme => ({
  root:{
    margin: '0% 24% 1% 24%',
    padding: '1% 2%',
    background: '#ddd',
    boxShadow: '0px 1px 14px 4px #0f0f0f',
  },
  containerDiv:{
    backgroundColor: '#ddd',
    padding: "0%",
    
  },
  mainPanel:{
    // boxShadow: 'inset 0px 2px 4px 0px #a7a7a7',
    // backgroundColor: '#e7eff8'
  }
}));