import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const supportedLngs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    supportedLngs,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      en: {
        translation: {
          nav: {
            features: 'Features',
            howItWorks: 'How It Works',
            successStories: 'Success Stories',
            login: 'Login',
            getStarted: 'Get Started'
          },
          home: {
            heroTitle: 'Master Languages',
            heroTitleFast: 'FAST',
            heroSubtitle: 'Revolutionize your language learning journey with AI-powered personalized lessons and real-time feedback.',
            startJourney: 'Start Your Journey',
            learnMore: 'Learn More'
          },
          features: {
            sectionTitle: 'Powerful Features',
            sectionSubtitle: 'Everything you need to master a new language effectively',
            feature1Title: 'AI-Powered Learning',
            feature1Desc: 'Personalized learning paths and adaptive exercises tailored to your progress',
            feature2Title: 'Multiple Languages',
            feature2Desc: 'Learn any language with native speaker quality audio and cultural insights',
            feature3Title: 'Community Learning',
            feature3Desc: 'Connect with fellow learners and practice with native speakers'
          },
          howItWorks: {
            sectionTitle: 'How It Works',
            sectionSubtitle: 'Start your language learning journey in three simple steps',
            step1Title: 'Choose Your Language',
            step1Desc: 'Select from our wide range of supported languages and set your goals',
            step2Title: 'Practice Daily',
            step2Desc: 'Follow your personalized learning path with AI-guided exercises',
            step3Title: 'Track Progress',
            step3Desc: 'Monitor your improvement and earn certificates as you advance'
          },
          testimonials: {
            sectionTitle: 'Success Stories',
            sectionSubtitle: 'Hear from our community of language learners',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'English Teacher',
            testimonial1Quote: 'The AI-powered learning system has transformed how I teach languages. My students are more engaged than ever.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Business Professional',
            testimonial2Quote: 'I needed to learn Japanese for work quickly. This platform made it possible and enjoyable.',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: 'Travel Enthusiast',
            testimonial3Quote: 'Learning multiple languages has never been easier. The community support is amazing!'
          },
          cta: {
            title: 'Ready to Start Your Language Journey?',
            subtitle: 'Join thousands of successful learners worldwide',
            button: 'Get Started Now'
          }
        }
      },
      de: {
        translation: {
          nav: {
            features: 'Funktionen',
            howItWorks: 'So funktioniert\'s',
            successStories: 'Erfolgsgeschichten',
            login: 'Anmelden',
            getStarted: 'Loslegen'
          },
          home: {
            heroTitle: 'Sprachen meistern',
            heroTitleFast: 'SCHNELL',
            heroSubtitle: 'Revolutionieren Sie Ihren Sprachlernprozess mit KI-gestützten, personalisierten Lektionen und Echtzeit-Feedback.',
            startJourney: 'Starten Sie Ihre Reise',
            learnMore: 'Mehr erfahren'
          },
          features: {
            sectionTitle: 'Leistungsstarke Funktionen',
            sectionSubtitle: 'Alles, was Sie brauchen, um eine neue Sprache effektiv zu beherrschen',
            feature1Title: 'KI-gestütztes Lernen',
            feature1Desc: 'Personalisierte Lernpfade und adaptive Übungen, die auf Ihren Fortschritt abgestimmt sind',
            feature2Title: 'Mehrere Sprachen',
            feature2Desc: 'Lernen Sie jede Sprache mit muttersprachlicher Audioqualität und kulturellen Einblicken',
            feature3Title: 'Gemeinschaftliches Lernen',
            feature3Desc: 'Vernetzen Sie sich mit anderen Lernenden und üben Sie mit Muttersprachlern'
          },
          howItWorks: {
            sectionTitle: 'Wie es funktioniert',
            sectionSubtitle: 'Starten Sie Ihre Sprachlernreise in drei einfachen Schritten',
            step1Title: 'Wählen Sie Ihre Sprache',
            step1Desc: 'Wählen Sie aus unserer großen Auswahl an unterstützten Sprachen und setzen Sie Ihre Ziele',
            step2Title: 'Täglich üben',
            step2Desc: 'Folgen Sie Ihrem personalisierten Lernpfad mit KI-gesteuerten Übungen',
            step3Title: 'Fortschritt verfolgen',
            step3Desc: 'Überwachen Sie Ihre Verbesserung und verdienen Sie Zertifikate während Ihres Fortschritts'
          },
          testimonials: {
            sectionTitle: 'Erfolgsgeschichten',
            sectionSubtitle: 'Hören Sie von unserer Gemeinschaft von Sprachlernenden',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'Englischlehrerin',
            testimonial1Quote: 'Das KI-gestützte Lernsystem hat die Art und Weise, wie ich Sprachen unterrichte, verändert. Meine Schüler sind engagierter denn je.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Geschäftsmann',
            testimonial2Quote: 'Ich musste schnell Japanisch für die Arbeit lernen. Diese Plattform hat es möglich und angenehm gemacht.',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: 'Reisebegeisterte',
            testimonial3Quote: 'Mehrere Sprachen zu lernen war noch nie so einfach. Die Unterstützung der Community ist fantastisch!'
          },
          cta: {
            title: 'Bereit, Ihre Sprachreise zu beginnen?',
            subtitle: 'Schließen Sie sich Tausenden erfolgreicher Lernender weltweit an',
            button: 'Jetzt beginnen'
          }
        }
      },
      es: {
        translation: {
          nav: {
            features: 'Características',
            howItWorks: 'Cómo funciona',
            successStories: 'Historias de éxito',
            login: 'Iniciar sesión',
            getStarted: 'Comenzar'
          },
          home: {
            heroTitle: 'Domina los idiomas',
            heroTitleFast: 'RÁPIDO',
            heroSubtitle: 'Revoluciona tu aprendizaje de idiomas con lecciones personalizadas impulsadas por IA y retroalimentación en tiempo real.',
            startJourney: 'Comienza tu viaje',
            learnMore: 'Aprender más'
          },
          features: {
            sectionTitle: 'Características Potentes',
            sectionSubtitle: 'Todo lo que necesitas para dominar un nuevo idioma de manera efectiva',
            feature1Title: 'Aprendizaje con IA',
            feature1Desc: 'Rutas de aprendizaje personalizadas y ejercicios adaptables según tu progreso',
            feature2Title: 'Múltiples Idiomas',
            feature2Desc: 'Aprende cualquier idioma con audio de calidad nativa y conocimientos culturales',
            feature3Title: 'Aprendizaje Comunitario',
            feature3Desc: 'Conéctate con otros estudiantes y practica con hablantes nativos'
          },
          howItWorks: {
            sectionTitle: 'Cómo Funciona',
            sectionSubtitle: 'Comienza tu viaje de aprendizaje de idiomas en tres simples pasos',
            step1Title: 'Elige tu Idioma',
            step1Desc: 'Selecciona entre nuestra amplia gama de idiomas soportados y establece tus objetivos',
            step2Title: 'Practica Diariamente',
            step2Desc: 'Sigue tu ruta de aprendizaje personalizada con ejercicios guiados por IA',
            step3Title: 'Sigue tu Progreso',
            step3Desc: 'Monitorea tu mejora y gana certificados mientras avanzas'
          },
          testimonials: {
            sectionTitle: 'Historias de Éxito',
            sectionSubtitle: 'Escucha a nuestra comunidad de estudiantes de idiomas',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'Profesora de Inglés',
            testimonial1Quote: 'El sistema de aprendizaje con IA ha transformado la forma en que enseño idiomas. Mis estudiantes están más comprometidos que nunca.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Profesional de Negocios',
            testimonial2Quote: 'Necesitaba aprender japonés rápidamente para el trabajo. Esta plataforma lo hizo posible y agradable.',
            testimonial3Name: 'Elena Rodríguez',
            testimonial3Role: 'Entusiasta de los Viajes',
            testimonial3Quote: '¡Aprender varios idiomas nunca ha sido tan fácil. El apoyo de la comunidad es increíble!'
          },
          cta: {
            title: '¿Listo para Comenzar tu Viaje Lingüístico?',
            subtitle: 'Únete a miles de estudiantes exitosos en todo el mundo',
            button: 'Comienza Ahora'
          }
        }
      },
      fr: {
        translation: {
          nav: {
            features: 'Fonctionnalités',
            howItWorks: 'Comment ça marche',
            successStories: 'Histoires de réussite',
            login: 'Connexion',
            getStarted: 'Commencer'
          },
          home: {
            heroTitle: 'Maîtrisez les langues',
            heroTitleFast: 'RAPIDE',
            heroSubtitle: 'Révolutionnez votre apprentissage des langues avec des leçons personnalisées alimentées par l\'IA et des retours en temps réel.',
            startJourney: 'Commencez votre voyage',
            learnMore: 'En savoir plus'
          },
          features: {
            sectionTitle: 'Fonctionnalités Puissantes',
            sectionSubtitle: 'Tout ce dont vous avez besoin pour maîtriser une nouvelle langue de manière efficace',
            feature1Title: 'Apprentissage IA',
            feature1Desc: 'Des parcours d\'apprentissage personnalisés et des exercices adaptés à votre progression',
            feature2Title: 'Plusieurs Langues',
            feature2Desc: 'Apprenez n\'importe quelle langue avec un audio de qualité native et des connaissances culturelles',
            feature3Title: 'Apprentissage Communautaire',
            feature3Desc: 'Entrez en contact avec d\'autres apprenants et pratiquez avec des locuteurs natifs'
          },
          howItWorks: {
            sectionTitle: 'Comment ça marche',
            sectionSubtitle: 'Démarrez votre parcours d\'apprentissage de la langue en trois étapes simples',
            step1Title: 'Choisissez votre langue',
            step1Desc: 'Sélectionnez parmi notre large gamme de langues prises en charge et définissez vos objectifs',
            step2Title: 'Pratiquez quotidiennement',
            step2Desc: 'Suivez votre parcours d\'apprentissage personnalisé avec des exercices guidés par IA',
            step3Title: 'Suivez votre progression',
            step3Desc: 'Surveillez votre progression et obtenez des certificats pendant votre progression'
          },
          testimonials: {
            sectionTitle: 'Témoignages',
            sectionSubtitle: 'Écoutez parmi notre communauté d\'apprenants de langues',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'Enseignante d\'anglais',
            testimonial1Quote: 'Le système d\'apprentissage IA a transformé la façon dont je donne des cours de langues. Mes élèves sont plus engagés que jamais.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Professionnel des affaires',
            testimonial2Quote: 'J\'ai besoin d\'apprendre rapidement le japonais pour le travail. Cette plateforme m\'a permis et rendu agréable.',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: 'Enthousiaste des voyages',
            testimonial3Quote: 'Apprendre plusieurs langues n\'était jamais aussi facile. Le soutien de la communauté est incroyable !'
          },
          cta: {
            title: 'Prêt à Commencer Votre Voyage Linguistique ?',
            subtitle: 'Rejoignez des milliers d\'apprenants réussis dans le monde entier',
            button: 'Commencez Maintenant'
          }
        }
      },
      it: {
        translation: {
          nav: {
            features: 'Funzionalità',
            howItWorks: 'Come funziona',
            successStories: 'Storie di successo',
            login: 'Accedi',
            getStarted: 'Inizia'
          },
          home: {
            heroTitle: 'Padroneggia le lingue',
            heroTitleFast: 'VELOCE',
            heroSubtitle: 'Rivoluziona il tuo apprendimento delle lingue con lezioni personalizzate basate sull\'IA e feedback in tempo reale.',
            startJourney: 'Inizia il tuo viaggio',
            learnMore: 'Scopri di più'
          },
          features: {
            sectionTitle: 'Funzionalità Potenti',
            sectionSubtitle: 'Tutto ciò di cui hai bisogno per padroneggiare una nuova lingua in modo efficace',
            feature1Title: 'Apprentissaggio IA',
            feature1Desc: 'Percorsi di apprendimento personalizzati e esercizi adattabili in base al tuo progresso',
            feature2Title: 'Molte Lingue',
            feature2Desc: 'Impara qualsiasi lingua con audio di alta qualità nativa e conoscenze culturali',
            feature3Title: 'Apprendimento Comunitario',
            feature3Desc: 'Connettiti con altri studenti e pratica con locutori nativi'
          },
          howItWorks: {
            sectionTitle: 'Come Funziona',
            sectionSubtitle: 'Inizia il tuo viaggio di apprendimento linguistico in tre semplici passaggi',
            step1Title: 'Scegli la tua Lingua',
            step1Desc: 'Seleziona tra la nostra vasta gamma di lingue supportate e definisci i tuoi obiettivi',
            step2Title: 'Pratica Giornalmente',
            step2Desc: 'Segui il tuo percorso di apprendimento personalizzato con esercizi guidati da IA',
            step3Title: 'Segui il Tuo Progresso',
            step3Desc: 'Monitora il tuo progresso e guadagna certificati mentre progredisci'
          },
          testimonials: {
            sectionTitle: 'Storie di Successo',
            sectionSubtitle: 'Ascolta la nostra comunità di studenti di lingue',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'Insegnante di Inglese',
            testimonial1Quote: 'Il sistema di apprendimento IA ha trasformato la modalità con cui insegno le lingue. I miei studenti sono più coinvolti che mai.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Professionale del Lavoro',
            testimonial2Quote: 'Ho bisogno di imparare rapidamente il giapponese per il lavoro. Questa piattaforma l\'ha reso possibile e piacevole.',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: 'Entusiasta dei Viaggi',
            testimonial3Quote: 'Imparare più lingue mai è stato così facile. Il supporto della comunità è incredibile!'
          },
          cta: {
            title: 'Pronto per Iniziare il Tuo Viaggio Linguistico?',
            subtitle: 'Unisciti a migliaia di studenti esperti in tutto il mondo',
            button: 'Inizia Ora'
          }
        }
      },
      ja: {
        translation: {
          nav: {
            features: '機能',
            howItWorks: '使い方',
            successStories: '成功事例',
            login: 'ログイン',
            getStarted: '始める'
          },
          home: {
            heroTitle: '言語をマスター',
            heroTitleFast: '速く',
            heroSubtitle: 'AIを活用したパーソナライズされたレッスンとリアルタイムフィードバックで、言語学習を革新します。',
            startJourney: '旅を始める',
            learnMore: 'もっと見る'
          },
          features: {
            sectionTitle: '機能',
            sectionSubtitle: '言語学習に必要なものをすべて備えた',
            feature1Title: 'AIパワード学習',
            feature1Desc: '進捗に合わせた個人用学習パスと適応型演習',
            feature2Title: '複数の言語',
            feature2Desc: 'ネイティブスピーカーの音質の音声と文化の知識を備えた言語学習',
            feature3Title: 'コミュニティ学習',
            feature3Desc: '他の学習者とネイティブスピーカーとの練習'
          },
          howItWorks: {
            sectionTitle: '使い方',
            sectionSubtitle: '言語学習の旅を3つの簡単なステップで始める',
            step1Title: '言語を選択',
            step1Desc: 'サポートされている言語の広範な範囲から選択し、目標を設定',
            step2Title: '毎日練習',
            step2Desc: 'AIガイドの練習を個人用学習パスに従って続ける',
            step3Title: '進捗を追跡',
            step3Desc: '進捗中に改善を監視し、証明書を獲得'
          },
          testimonials: {
            sectionTitle: '成功事例',
            sectionSubtitle: '言語学習者のコミュニティから聞いた',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: '英語教師',
            testimonial1Quote: 'AIパワード学習システムは、言語を教える方法を変えました。私の生徒は今まで以上に参加しています。',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'ビジネスプロフェッショナル',
            testimonial2Quote: '仕事ですぐに日本語を学ぶ必要がありました。このプラットフォームは可能にして楽しくしました。',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: '旅行好き',
            testimonial3Quote: '言語を学ぶことは今まで以上に簡単でした。コミュニティのサポートは素晴らしいです！'
          },
          cta: {
            title: '言語学習の旅を始めますか？',
            subtitle: '世界中の成功した学習者に参加',
            button: '今すぐ始める'
          }
        }
      },
      pt: {
        translation: {
          nav: {
            features: 'Recursos',
            howItWorks: 'Como funciona',
            successStories: 'Histórias de sucesso',
            login: 'Entrar',
            getStarted: 'Começar'
          },
          home: {
            heroTitle: 'Domine idiomas',
            heroTitleFast: 'RÁPIDO',
            heroSubtitle: 'Revolucione sua jornada de aprendizado de idiomas com lições personalizadas alimentadas por IA e feedback em tempo real.',
            startJourney: 'Comece sua jornada',
            learnMore: 'Saiba mais'
          },
          features: {
            sectionTitle: 'Recursos Potentes',
            sectionSubtitle: 'Tudo o que você precisa para dominar uma nova língua de forma eficaz',
            feature1Title: 'Aprendizado IA',
            feature1Desc: 'Caminhos de aprendizado personalizados e exercícios adaptáveis de acordo com o seu progresso',
            feature2Title: 'Múltiplas Línguas',
            feature2Desc: 'Aprenda qualquer idioma com áudio de alta qualidade nativa e conhecimentos culturais',
            feature3Title: 'Aprendizado Comunitário',
            feature3Desc: 'Conecte-se com outros estudantes e pratique com falantes nativos'
          },
          howItWorks: {
            sectionTitle: 'Como Funciona',
            sectionSubtitle: 'Comece sua jornada de aprendizado de idiomas em três passos simples',
            step1Title: 'Escolha seu Idioma',
            step1Desc: 'Selecione entre nosso amplo intervalo de idiomas suportados e defina seus objetivos',
            step2Title: 'Pratique Diariamente',
            step2Desc: 'Siga seu caminho de aprendizado personalizado com exercícios guiados por IA',
            step3Title: 'Siga seu Progresso',
            step3Desc: 'Monitore seu progresso e ganhe certificados enquanto avança'
          },
          testimonials: {
            sectionTitle: 'Histórias de Sucesso',
            sectionSubtitle: 'Ouça a nossa comunidade de estudantes de idiomas',
            testimonial1Name: 'Sarah Johnson',
            testimonial1Role: 'Professora de Inglês',
            testimonial1Quote: 'O sistema de aprendizado IA transformou a maneira como ensino idiomas. Meus alunos estão mais comprometidos do que nunca.',
            testimonial2Name: 'Marcus Schmidt',
            testimonial2Role: 'Profissional de Negócios',
            testimonial2Quote: 'Eu precisava aprender japonês rapidamente para o trabalho. Este plataforma fez isso possível e agradável.',
            testimonial3Name: 'Elena Rodriguez',
            testimonial3Role: 'Entusiasta de Viagens',
            testimonial3Quote: 'Aprender vários idiomas nunca foi tão fácil. O suporte da comunidade é incrível!'
          },
          cta: {
            title: 'Pronto para Começar sua Viagem Linguística?',
            subtitle: 'Junte-se a milhares de estudantes bem-sucedidos em todo o mundo',
            button: 'Comece Agora'
          }
        }
      }
    }
  });

export default i18n; 