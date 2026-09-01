import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorArrowRight,
  phosphorArrowUpRight,
  phosphorBrain,
  phosphorCaretLeft,
  phosphorCaretRight,
  phosphorChatCircleText,
  phosphorCloud,
  phosphorCode,
  phosphorDatabase,
  phosphorDownloadSimple,
  phosphorEnvelopeSimple,
  phosphorEye,
  phosphorGearSix,
  phosphorGithubLogo,
  phosphorHardDrives,
  phosphorLinkedinLogo,
  phosphorList,
  phosphorMoon,
  phosphorPaperPlaneTilt,
  phosphorRobot,
  phosphorSun,
  phosphorTable,
  phosphorX,
} from '@ng-icons/phosphor-icons/regular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideIcons({
      phosphorArrowRight,
      phosphorArrowUpRight,
      phosphorBrain,
      phosphorCaretLeft,
      phosphorCaretRight,
      phosphorChatCircleText,
      phosphorCloud,
      phosphorCode,
      phosphorDatabase,
      phosphorDownloadSimple,
      phosphorEnvelopeSimple,
      phosphorEye,
      phosphorGearSix,
      phosphorGithubLogo,
      phosphorHardDrives,
      phosphorLinkedinLogo,
      phosphorList,
      phosphorMoon,
      phosphorPaperPlaneTilt,
      phosphorRobot,
      phosphorSun,
      phosphorTable,
      phosphorX,
    }),
  ],
};
