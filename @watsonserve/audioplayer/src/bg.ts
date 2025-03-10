import ResMgr from './res_mgr';
import { Player } from '.';
import Channel from './channel';

(async function() {
  const channel = await Channel.getInstance();

  const listLoader = async (resPath: string) => {
    const resp = await channel.bridge('LOAD_LIST', { resPath });
    return (resp as any[]).map((item: any) => ({
      ...item,
      path: item.url,
      mode: item.perm
    }));
  };

  const player = new Player(new ResMgr(listLoader));
  player.loadList('location');

  ['error', 'costed', 'played', 'ended', 'listChanged', 'stateChange'].forEach(evName => {
    player.addListener(evName, args => channel.emit(evName, args));
  });

  channel.addListener('getStat', () => channel.emit('getStatResp', player.getStat()));
  channel.addListener('frequencies', () => channel.emit('frequenciesResp', player.frequencyValues));
  channel.addListener('setEq', eq => channel.emit('setEqResp', player.setEq(eq)));
  channel.addListener('load', async (idx: number) => channel.emit('loadResp', await player.load(idx)));


  channel.addListener('setLoop', player.setLoop.bind(player));
  channel.addListener('setRandom', player.setRandom.bind(player));
  channel.addListener('loadList', player.loadList.bind(player));
  channel.addListener('loadNext', player.loadNext.bind(player));
  channel.addListener('togglePlay', player.togglePlay.bind(player));
  channel.addListener('play', player.play.bind(player));
  channel.addListener('pause', player.pause.bind(player));
  channel.addListener('stop', player.stop.bind(player));
  channel.addListener('seek', ({ seek }: any) => player.seek(seek));
})();
