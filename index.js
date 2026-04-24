require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Armazena embeds em edição por usuário
const embedSessions = new Map();

function getDefaultData() {
  return {
    title: 'Título do Embed',
    description: 'Descrição do embed',
    color: '#2b2d31',
    authorName: '',
    authorIcon: '',
    footerText: '',
    footerIcon: '',
    image: '',
    thumbnail: '',
    fields: []
  };
}

function buildEmbed(data) {
  const embed = new EmbedBuilder();

  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);

  try {
    if (data.color) embed.setColor(data.color);
  } catch {
    embed.setColor('#2b2d31');
  }

  if (data.authorName) {
    embed.setAuthor({
      name: data.authorName,
      iconURL: data.authorIcon || undefined
    });
  }

  if (data.footerText) {
    embed.setFooter({
      text: data.footerText,
      iconURL: data.footerIcon || undefined
    });
  }

  if (data.image) embed.setImage(data.image);
  if (data.thumbnail) embed.setThumbnail(data.thumbnail);

  if (Array.isArray(data.fields) && data.fields.length > 0) {
    embed.addFields(
      data.fields.slice(0, 25).map(f => ({
        name: f.name || 'Sem nome',
        value: f.value || 'Sem valor',
        inline: !!f.inline
      }))
    );
  }

  return embed;
}

function buildPanelButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_title')
      .setLabel('Título')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_description')
      .setLabel('Descrição')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_color')
      .setLabel('Cor')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_author')
      .setLabel('Autor')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_fields')
      .setLabel('Campos')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_images')
      .setLabel('Imagem e Thumbnail')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_footer')
      .setLabel('Rodapé')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_publish')
      .setLabel('Publicar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('embed_export')
      .setLabel('Exportar JSON')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('embed_reset')
      .setLabel('Resetar')
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

function createModal(customId, title, inputs) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  const rows = inputs.map(input =>
    new ActionRowBuilder().addComponents(input)
  );

  modal.addComponents(...rows);
  return modal;
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash command
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'embed-criar') {
        const session = getDefaultData();
        embedSessions.set(interaction.user.id, session);

        const painelEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Painel de Criação de Embed')
          .setDescription('Use os botões abaixo para editar sua embed.')
          .addFields(
            { name: 'Título atual', value: session.title, inline: false },
            { name: 'Descrição atual', value: session.description, inline: false }
          );

        await interaction.reply({
          embeds: [painelEmbed, buildEmbed(session)],
          components: buildPanelButtons(),
          ephemeral: true
        });
      }
      return;
    }

    // Botões
    if (interaction.isButton()) {
      const data = embedSessions.get(interaction.user.id);
      if (!data) {
        return interaction.reply({
          content: 'Sua sessão expirou. Use `/embed-criar` novamente.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'embed_title') {
        const modal = createModal('modal_title', 'Editar Título', [
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Título')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(data.title || '')
            .setMaxLength(256)
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_description') {
        const modal = createModal('modal_description', 'Editar Descrição', [
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Descrição')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(data.description || '')
            .setMaxLength(4000)
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_color') {
        const modal = createModal('modal_color', 'Editar Cor', [
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Cor em HEX')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(data.color || '#2b2d31')
            .setPlaceholder('#5865F2')
            .setMaxLength(7)
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_author') {
        const modal = createModal('modal_author', 'Editar Autor', [
          new TextInputBuilder()
            .setCustomId('author_name')
            .setLabel('Nome do autor')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.authorName || ''),
          new TextInputBuilder()
            .setCustomId('author_icon')
            .setLabel('URL do ícone do autor')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.authorIcon || '')
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_footer') {
        const modal = createModal('modal_footer', 'Editar Rodapé', [
          new TextInputBuilder()
            .setCustomId('footer_text')
            .setLabel('Texto do rodapé')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.footerText || ''),
          new TextInputBuilder()
            .setCustomId('footer_icon')
            .setLabel('URL do ícone do rodapé')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.footerIcon || '')
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_images') {
        const modal = createModal('modal_images', 'Imagem e Thumbnail', [
          new TextInputBuilder()
            .setCustomId('image')
            .setLabel('URL da imagem')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.image || ''),
          new TextInputBuilder()
            .setCustomId('thumbnail')
            .setLabel('URL da thumbnail')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(data.thumbnail || '')
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_fields') {
        const modal = createModal('modal_fields', 'Adicionar Campo', [
          new TextInputBuilder()
            .setCustomId('field_name')
            .setLabel('Nome do campo')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256),
          new TextInputBuilder()
            .setCustomId('field_value')
            .setLabel('Valor do campo')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1024),
          new TextInputBuilder()
            .setCustomId('field_inline')
            .setLabel('Inline? (sim ou nao)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('sim')
        ]);
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'embed_publish') {
        await interaction.channel.send({
          embeds: [buildEmbed(data)]
        });

        return interaction.reply({
          content: '✅ Embed publicada no canal.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'embed_export') {
        return interaction.reply({
          content: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
          ephemeral: true
        });
      }

      if (interaction.customId === 'embed_reset') {
        const resetData = getDefaultData();
        embedSessions.set(interaction.user.id, resetData);

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('Painel de Criação de Embed')
              .setDescription('Embed resetada com sucesso.'),
            buildEmbed(resetData)
          ],
          components: buildPanelButtons()
        });
      }
    }

    // Modals
    if (interaction.isModalSubmit()) {
      const data = embedSessions.get(interaction.user.id);
      if (!data) {
        return interaction.reply({
          content: 'Sua sessão expirou. Use `/embed-criar` novamente.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'modal_title') {
        data.title = interaction.fields.getTextInputValue('title');
      }

      if (interaction.customId === 'modal_description') {
        data.description = interaction.fields.getTextInputValue('description');
      }

      if (interaction.customId === 'modal_color') {
        data.color = interaction.fields.getTextInputValue('color');
      }

      if (interaction.customId === 'modal_author') {
        data.authorName = interaction.fields.getTextInputValue('author_name');
        data.authorIcon = interaction.fields.getTextInputValue('author_icon');
      }

      if (interaction.customId === 'modal_footer') {
        data.footerText = interaction.fields.getTextInputValue('footer_text');
        data.footerIcon = interaction.fields.getTextInputValue('footer_icon');
      }

      if (interaction.customId === 'modal_images') {
        data.image = interaction.fields.getTextInputValue('image');
        data.thumbnail = interaction.fields.getTextInputValue('thumbnail');
      }

      if (interaction.customId === 'modal_fields') {
        if (data.fields.length >= 25) {
          return interaction.reply({
            content: '❌ A embed já atingiu o limite de 25 campos.',
            ephemeral: true
          });
        }

        const name = interaction.fields.getTextInputValue('field_name');
        const value = interaction.fields.getTextInputValue('field_value');
        const inlineRaw = interaction.fields.getTextInputValue('field_inline') || 'nao';

        data.fields.push({
          name,
          value,
          inline: ['sim', 's', 'true', '1'].includes(inlineRaw.toLowerCase())
        });
      }

      embedSessions.set(interaction.user.id, data);

      const painelEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Painel de Criação de Embed')
        .setDescription('Sua embed foi atualizada.')
        .addFields(
          { name: 'Título atual', value: data.title || 'Sem título', inline: false },
          {
            name: 'Campos',
            value: `${data.fields.length} campo(s) adicionados`,
            inline: false
          }
        );

      await interaction.reply({
        embeds: [painelEmbed, buildEmbed(data)],
        components: buildPanelButtons(),
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Erro:', error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Ocorreu um erro ao processar a ação.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ Ocorreu um erro ao processar a ação.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);