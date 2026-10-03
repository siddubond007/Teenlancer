const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const taxonomy = [
  {
    name: "Web Development",
    isRestricted: false,
    subcategories: [
      {
        name: "Frontend Development",
        skills: ["React.js", "Next.js", "Vue.js", "Tailwind CSS", "HTML5", "CSS3"]
      },
      {
        name: "Backend Development",
        skills: ["Node.js", "Python", "Django", "PostgreSQL", "Express", "Go"]
      }
    ]
  },
  {
    name: "AI & Machine Learning",
    isRestricted: false,
    subcategories: [
      {
        name: "Generative AI",
        skills: ["Prompt Engineering", "OpenAI API", "LangChain", "Model Fine-Tuning"]
      },
      {
        name: "Data Science",
        skills: ["Predictive Modeling", "Python", "TensorFlow", "PyTorch"]
      }
    ]
  },
  {
    name: "Design & Creative",
    isRestricted: false,
    subcategories: [
      {
        name: "Brand Identity",
        skills: ["Logo Design", "Brand Style Guides", "Business Cards"]
      },
      {
        name: "UI/UX Design",
        skills: ["Figma", "Wireframing", "User Journey Mapping", "Prototyping"]
      }
    ]
  },
  {
    name: "Legal Services",
    isRestricted: true,
    subcategories: [
      {
        name: "Legal Support",
        skills: ["Contract Drafting", "Privacy Policies", "NDA Creation", "Legal Research"]
      }
    ]
  }
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Starting taxonomy seeding...');
  
  for (const cat of taxonomy) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        isRestricted: cat.isRestricted,
      }
    });

    for (const sub of cat.subcategories) {
      const subSlug = slugify(cat.name + '-' + sub.name);
      const subcategory = await prisma.subcategory.upsert({
        where: { slug: subSlug },
        update: {},
        create: {
          name: sub.name,
          slug: subSlug,
          categoryId: category.id
        }
      });

      for (const skillName of sub.skills) {
        const skillSlug = slugify(cat.name + '-' + sub.name + '-' + skillName);
        await prisma.skill.upsert({
          where: { slug: skillSlug },
          update: {},
          create: {
            name: skillName,
            slug: skillSlug,
            subcategoryId: subcategory.id
          }
        });
      }
    }
  }
  console.log('Taxonomy seeding completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
