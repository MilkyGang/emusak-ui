import { GetState, PartialState, SetState } from "zustand/vanilla";
import { ipcRenderer } from "electron";
import { IAlert } from "./alert.action";
import { EmusakEmulatorConfig, EmusakEmulatorMode, LS_KEYS } from "../../types";
import Swal from 'sweetalert2';
import { i18n } from '../app';
import { ITitleBar } from "./titleBar.actions";

export interface IEmulatorConfig {
  addNewEmulatorConfigAction: () => PartialState<IEmulatorConfig>;
  emulatorBinariesPath: EmusakEmulatorConfig[];
  selectedConfig: EmusakEmulatorConfig;
  setSelectConfigAction: (selectedConfig: EmusakEmulatorConfig) => PartialState<IEmulatorConfig>,
  getModeForBinary: (binaryPath: string) => Promise<EmusakEmulatorMode>;
  createDefaultConfig: () => void;
}

const configuredEmulators: IEmulatorConfig["emulatorBinariesPath"] = JSON.parse(localStorage.getItem(LS_KEYS.CONFIG)) || [];

const emulatorConfig = (set: SetState<IEmulatorConfig>, get: GetState<Partial<IAlert & IEmulatorConfig & ITitleBar>>) => ({
  emulatorBinariesPath: configuredEmulators,
  selectedConfig: null as EmusakEmulatorConfig,
  setSelectConfigAction: (selectedConfig: EmusakEmulatorConfig = null) => {
    if (!selectedConfig) {
      return;
    }

    return set({ selectedConfig });
  },
  addNewEmulatorConfigAction: async () => {
    await Swal.fire({
      icon: 'info',
      text: get().currentEmu === "ryu" ? i18n.t('pickRyuBin') : i18n.t('pickYuzuBin')
    })

    const response: { error: boolean, code: string } | string = await ipcRenderer.invoke('add-emulator-folder', get().currentEmu);

    if (typeof response === 'object') {
      get().openAlertAction('error', response.code);
      return null;
    }

    const emulatorBinariesPath = get().emulatorBinariesPath || [];

    if (emulatorBinariesPath.find(item => item.path === response)) {
      get().openAlertAction('error', 'EMULATOR_PATH_ALREADY_EXISTS');
      return null;
    }

    let promptUserForConfiguration = true;
    while (promptUserForConfiguration) {
      const { isConfirmed, value } = await Swal.fire({
        text: i18n.t('addConfigTitle'),
        input: 'text',
        inputAttributes: {
          placeholder: i18n.t('addConfigEg')
        },
        showCancelButton: true,
      });

      if (!isConfirmed) {
        promptUserForConfiguration = false;
      }

      if (value && value.length > 0) {
        const config: EmusakEmulatorConfig = {
          path: response,
          name: value,
          emulator: get().currentEmu
        };
        emulatorBinariesPath.push(config);

        localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(emulatorBinariesPath));
        return set({ emulatorBinariesPath, selectedConfig: config });
      }
    }
  },
  removeEmulatorConfigAction: (path: string) => {
    const configs = get().emulatorBinariesPath;
    const index = configs.findIndex(item => item.path === path);
    configs.splice(index, 1);
    localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(configs));
    return set({ emulatorBinariesPath: configs, selectedConfig: configs.filter(c => c.emulator === get().currentEmu)[0] });
  },
  getModeForBinary: async (path: string): Promise<EmusakEmulatorMode> => {
    return ipcRenderer.invoke('system-scan-for-config', get().currentEmu, path);
  },
  createDefaultConfig: async () => {
    const config = await ipcRenderer.invoke('build-default-emu-config', get().currentEmu);
    const configs = get().emulatorBinariesPath;
    configs.push(config);
    localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(configs));
    return set({ emulatorBinariesPath: configs, selectedConfig: config });
  }
});

export default emulatorConfig;