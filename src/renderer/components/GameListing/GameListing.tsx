import React, { useEffect, useState } from "react";
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Masonry from '@mui/lab/Masonry';
import { styled } from '@mui/material/styles';
import './gameListing.css'
import { EmusakEmulatorConfig, EmusakEmulatorMode } from "../../../types";
import useStore from "../../actions/state";
import { Chip, Divider, Grid, IconButton, Tooltip } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from "react-i18next";
import { ipcRenderer } from "electron";
import jackSober from '../../resources/jack_sober.png';

interface IEmulatorContainer {
  config: EmusakEmulatorConfig;
}

const Label = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  border: '1px solid black',
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 0',
  color: '#FFF',
  zIndex: 1
}));

const GameListing = ({ config }: IEmulatorContainer) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EmusakEmulatorMode>(null);
  const [getModeForBinary, currentEmu] = useStore(s => [s.getModeForBinary, s.currentEmu]);
  const [games, setGames] = useState<{ title: string, img: string }[]>([]);

  useEffect(() => {
    getModeForBinary(config.path).then(m => {
      setMode(m);
      ipcRenderer
        .invoke('scan-games', m.dataPath, currentEmu)
        .then(async g => {
          const gamesCollection: { title: string, img: string }[]  = await Promise.all(g.map(async (i: string) => ipcRenderer.invoke('build-metadata-from-titleId', i)));
          setGames(gamesCollection)
        });
    });
  }, []);

  return (
    <>
      {
        mode && (
          <Stack className="masonry" spacing={2}>
            <Grid container>
              <Grid item xs={12}>
                { t('mode') } <Chip color="primary" label={mode.mode} />
                &nbsp;
                <Tooltip placement="right" title={`${t('readingDataPath')} ${mode.dataPath}`}>
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>

            {
              games.length > 0
                ? (
                  <Masonry columns={/** Clamp between 3 and 5 the value **/ Math.min(Math.max(games.length, 3), 5)} spacing={4}>
                    {games.map((item, index) => (
                      <Stack key={index}>
                        <Label>{item.title.length > 29 ? `${item.title.slice(0, 29)}...` : item.title}</Label>
                        <img
                          referrerPolicy="no-referrer"
                          src={item.img}
                          alt={item.title}
                          loading="lazy"
                          data-name={item.title}
                          style={{ borderBottomLeftRadius: 4, borderBottomRightRadius: 4, minHeight: 214 }}
                        />
                      </Stack>
                    ))}
                    {
                      games.length < 3 && (<Stack><p>&nbsp;</p></Stack>)
                    }
                  </Masonry>
                )
              : (
                <div style={{ textAlign: 'center', width: '50%', margin: '0 auto' }}>
                  <p>
                    <img width="100%" src={jackSober} alt=""/>
                  </p>
                  <Divider />
                  <h4 dangerouslySetInnerHTML={{ __html: t('launchRyujinx') }} />
                </div>
              )
            }
          </Stack>
        )
      }
    </>
  );
}

export default GameListing;
