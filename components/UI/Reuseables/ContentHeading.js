import React from 'react';
import {makeStyles} from '@material-ui/core';



const ProfileMainBasicInfo = function(props) {

    const {text} = props;

  const classes = useStyles();

 

  return (
    <div className={classes.root}>
        <div className={classes.heading}>
            <span className={classes.headingSpan}>{text}</span>
        </div>
        

    </div>
  );
}

export default ProfileMainBasicInfo

const useStyles = makeStyles(theme => ({
  root:{
    background: '#fff',
    padding: '1% 2%',
    fontFamily: 'arial',
    border: '1px solid #eee',
  },
  heading:{
    width: '100%',
  },
  headingSpan:{
    fontSize: '2em',
    color: "#666",
  },

}));