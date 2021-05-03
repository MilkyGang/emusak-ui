import React, { useState } from "react";
import {Button, Grid} from "@material-ui/core";
import { listDirectories } from "../../../service/fs"
import RyujinxModel, { IRyujinxConfig } from "../../../model/RyujinxModel";
import ryu_logo from "../../../assets/ryu_logo.png"
import RyuGameList from "./RyuGameList";
import { pickOneFolder } from "../../../service/ui";
import Alert from '@material-ui/lab/Alert';

const RyujinxHome = () => {
  const [directories, setDirectories]: [IRyujinxConfig[], Function] = useState(RyujinxModel.getDirectories());
  const [isAlertDisplayed, setIsAlertDisplayed] = useState(localStorage.getItem('ryu-alert') !== 'true');

  /**
   * When user pick a ryujinx folder, ensure it is valid (has Ryujinx.exe file) and check if it is portable mode or not
   * Then add this new configuration to database
   */
  const onRyuFolderSelect = async () => {
    const path = await pickOneFolder();

    if (path) { // User did not cancel operation
      const isPortable = (await listDirectories(path)).includes("portable");
      RyujinxModel.addDirectory({ isPortable, path });
      setDirectories(RyujinxModel.getDirectories()) // Refresh list
    }
  }

  const onAlertClose = () => {
    localStorage.setItem('ryu-alert', 'true');
    setIsAlertDisplayed(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <Grid container>
        <Grid item xs={9} style={{ display: 'flex', alignItems: 'center' }}>
          <p>
            <img src={ryu_logo} height={36} alt=""/>
          </p>
          &nbsp;
          &nbsp;
          <h2>
            Ryujinx
          </h2>
        </Grid>
        <Grid item xs={3}>
          <Button color="primary" variant="contained" fullWidth onClick={() => onRyuFolderSelect()}>Add ryujinx folder</Button>
        </Grid>

        {
          isAlertDisplayed && (
            <Grid item xs={12}>
              <br />
              <Alert severity="info" onClose={() => onAlertClose()}>Please note you have to launch a game 1 time to see it in the list below</Alert>
            </Grid>
          )
        }

        <Grid style={{ marginTop: 16 }} item xs={12}>
          <hr />
          <br />
          {
            directories.map((config: IRyujinxConfig) => <RyuGameList
                key={config.path}
                config={config}
              />
            )
          }
        </Grid>
      </Grid>
    </div>
  );
}

export default RyujinxHome;